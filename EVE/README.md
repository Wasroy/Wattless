# EVE — The AI That Creates AI Models

EVE is an AI assistant that lets anyone create custom fine-tuned AI models from a single conversation. Describe what you need in plain language, and EVE handles the entire pipeline: dataset generation, training code, GPU selection, real training, evaluation, and deployment.

## Architecture

```
User prompt
    │
    ▼
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind + Framer)    │
│  Split-screen: Chat left / Workspace right      │
└──────────────────┬──────────────────────────────┘
                   │ SSE streaming
                   ▼
┌─────────────────────────────────────────────────┐
│  Backend (FastAPI)                               │
│  6 endpoints: chat, dataset, code, scan,         │
│  deploy, playground                              │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ Claude API   │  │ NERVE Scan  │               │
│  │ (Anthropic)  │  │ (Azure +    │               │
│  │              │  │  Weather +  │               │
│  │              │  │  Carbon)    │               │
│  └─────────────┘  └─────────────┘               │
│                                                  │
│  ┌──────────────────────────────┐               │
│  │ Modal (Serverless GPU)       │               │
│  │ - train_model() on T4 GPU   │               │
│  │ - run_inference() on T4 GPU │               │
│  │ - TinyLlama 1.1B + LoRA     │               │
│  └──────────────────────────────┘               │
└─────────────────────────────────────────────────┘
```

## Pipeline (6 steps)

1. **Understand** — EVE asks 1-2 questions to understand the task (classification, generation, summarization...)
2. **Dataset** — Generates 20 training examples via Claude API (diverse, realistic pairs)
3. **Code** — Generates a full fine-tuning script (HuggingFace + PEFT/LoRA)
4. **GPU Scan (NERVE)** — Scans Azure regions live for the cheapest, greenest GPU (spot pricing + carbon intensity + weather)
5. **Training** — Deploys to a real T4 GPU on Modal, fine-tunes TinyLlama 1.1B with LoRA (r=16, alpha=32, 2 epochs)
6. **Playground** — Test your model instantly with real inference on the fine-tuned weights

## Key Features

- **100% Real** — No simulation. Real GPU training, real metrics, real inference.
- **NERVE Scoring** — GPU selection based on: 50% cost + 20% carbon + 15% availability + 10% cooling + 5% renewable energy
- **Green AI** — Tracks CO2 emissions per training run, picks low-carbon regions
- **Real Accuracy** — Computed by running inference on held-out eval set (exact match)
- **Model Persistence** — Trained model metadata saved to disk, survives server restarts

## Tech Stack

| Component | Stack |
|-----------|-------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, SSE streaming |
| AI | Anthropic Claude API (chat, dataset gen, code gen) |
| Training | Modal (serverless GPU), TinyLlama 1.1B, LoRA via PEFT/trl |
| GPU Scan | Azure Retail Prices API, Open-Meteo, Carbon Intensity UK |

## Setup

### Backend

```bash
cd EVE/backend
pip install -r requirements.txt
# Create .env with your keys (see .env file)
python eve.py
# Server runs on http://localhost:8001
```

### Modal (GPU training)

```bash
pip install modal
modal token new
modal deploy modal_train.py
```

### Frontend

```bash
cd EVE/frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | SSE streaming conversation with EVE |
| POST | `/api/generate-dataset` | Generate training examples via Claude |
| POST | `/api/generate-code` | Generate fine-tuning script via Claude |
| POST | `/api/scan` | NERVE GPU scan (live Azure + weather + carbon) |
| POST | `/api/deploy` | Launch real training on Modal GPU (SSE progress) |
| POST | `/api/playground` | Run inference on fine-tuned model |

## Team

Built for **Europe Hack 2026** by Nicolas & William.
