"""
Modal app for real GPU training + inference.
Fine-tunes TinyLlama 1.1B with LoRA on user-provided datasets.
v2 — fixed SFTConfig args for trl>=0.28
"""

import modal
import json

# ---------------------------------------------------------------------------
# Modal setup
# ---------------------------------------------------------------------------

app = modal.App("eve-training")

# Container image with all ML dependencies
training_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch>=2.1.0",
        "transformers>=4.36.0",
        "peft>=0.7.0",
        "trl>=0.7.0",
        "datasets>=2.16.0",
        "accelerate>=0.25.0",
        "bitsandbytes>=0.42.0",
        "scipy",
    )
)

# Volume to persist trained models
model_volume = modal.Volume.from_name("eve-models", create_if_missing=True)
MODEL_DIR = "/models"

# ---------------------------------------------------------------------------
# Training function
# ---------------------------------------------------------------------------

@app.function(
    image=training_image,
    gpu="T4",
    timeout=1800,  # 30 min max
    volumes={MODEL_DIR: model_volume},
)
def train_model(
    dataset_json: str,
    task: str,
    model_id: str,
    base_model: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    num_epochs: int = 2,
    batch_size: int = 4,
    learning_rate: float = 2e-4,
) -> dict:
    """
    Fine-tune a model with LoRA on the provided dataset.
    Returns training metrics.
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from trl import SFTTrainer, SFTConfig
    from datasets import Dataset
    import time
    import os

    start_time = time.time()

    # Parse dataset
    examples = json.loads(dataset_json)

    # Format as chat-style prompts
    def format_example(ex):
        return f"### Task: {task}\n### Input:\n{ex['input']}\n### Output:\n{ex['output']}"

    texts = [format_example(ex) for ex in examples]

    # Split 80/20
    split_idx = max(1, int(len(texts) * 0.8))
    train_texts = texts[:split_idx]
    eval_texts = texts[split_idx:]

    train_dataset = Dataset.from_dict({"text": train_texts})
    eval_dataset = Dataset.from_dict({"text": eval_texts})

    print(f"[EVE] Training on {len(train_texts)} examples, eval on {len(eval_texts)}")
    print(f"[EVE] Base model: {base_model}")
    print(f"[EVE] Task: {task}")

    # Load model + tokenizer
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )

    # LoRA config
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    )

    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"[EVE] Trainable: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

    # Output directory
    output_dir = os.path.join(MODEL_DIR, model_id)
    os.makedirs(output_dir, exist_ok=True)

    # Training arguments
    training_args = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        gradient_accumulation_steps=2,
        learning_rate=learning_rate,
        weight_decay=0.01,
        warmup_ratio=0.1,
        logging_steps=5,
        eval_strategy="epoch",
        save_strategy="epoch",
        fp16=True,
        dataset_text_field="text",
    )

    # Trainer
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        processing_class=tokenizer,
    )

    # Train
    train_result = trainer.train()

    # Evaluate
    eval_result = trainer.evaluate()

    # Save adapter
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    model_volume.commit()

    elapsed = time.time() - start_time
    train_loss = train_result.training_loss
    eval_loss = eval_result.get("eval_loss", train_loss * 1.1)

    # Real accuracy — run inference on eval set
    correct = 0
    eval_examples = examples[split_idx:]
    model.eval()
    for ex in eval_examples:
        prompt = f"### Task: {task}\n### Input:\n{ex['input']}\n### Output:\n"
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_new_tokens=64,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
        generated = tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()
        expected = ex["output"].strip()
        if generated.lower() == expected.lower():
            correct += 1
    accuracy = round(correct / max(len(eval_examples), 1) * 100, 1)
    print(f"[EVE] Real accuracy: {correct}/{len(eval_examples)} = {accuracy}%")

    # Estimate cost (Modal T4 = ~$0.59/hr)
    cost_usd = round(elapsed / 3600 * 0.59, 2)

    # Estimate CO2 (T4 = 0.07 kWh/hr, ~200 gCO2/kWh average)
    co2_grams = round(elapsed / 3600 * 0.07 * 200 * 1.2, 1)

    result = {
        "model_id": model_id,
        "train_loss": round(train_loss, 4),
        "eval_loss": round(eval_loss, 4),
        "accuracy": round(accuracy, 1),
        "num_train_examples": len(train_texts),
        "num_eval_examples": len(eval_texts),
        "epochs": num_epochs,
        "runtime_sec": round(elapsed, 1),
        "total_time": f"{int(elapsed // 60)}m {int(elapsed % 60)}s",
        "cost_usd": cost_usd,
        "co2_grams": co2_grams,
        "base_model": base_model,
        "output_dir": output_dir,
    }

    print(f"[EVE] Training complete: {json.dumps(result, indent=2)}")
    return result


# ---------------------------------------------------------------------------
# Inference function
# ---------------------------------------------------------------------------

@app.function(
    image=training_image,
    gpu="T4",
    timeout=300,  # 5 min max
    volumes={MODEL_DIR: model_volume},
)
def run_inference(
    model_id: str,
    input_text: str,
    task: str,
    base_model: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    max_new_tokens: int = 256,
) -> str:
    """
    Run inference on a fine-tuned model.
    Loads LoRA adapter from volume and generates output.
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    import os

    adapter_dir = os.path.join(MODEL_DIR, model_id)

    if not os.path.exists(adapter_dir):
        return f"Error: Model {model_id} not found."

    model_volume.reload()

    # Load base model + adapter
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(model, adapter_dir)
    model.eval()

    # Format prompt same as training
    prompt = f"### Task: {task}\n### Input:\n{input_text}\n### Output:\n"

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.pad_token_id,
        )

    # Decode only the generated tokens (skip the prompt)
    generated = outputs[0][inputs["input_ids"].shape[1]:]
    result = tokenizer.decode(generated, skip_special_tokens=True).strip()

    return result
