import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat, generateDataset, generateCode, scanGPU, streamDeploy } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import InputBar from "@/components/InputBar";
import MessageBubble from "@/components/MessageBubble";
import DatasetCard from "@/components/DatasetCard";
import CodeCard from "@/components/CodeCard";
import ScanCard from "@/components/ScanCard";
import TrainingCard from "@/components/TrainingCard";
import EvalCard from "@/components/EvalCard";
import DeliveryCard from "@/components/DeliveryCard";
import { Sparkles } from "lucide-react";

// ---- Types ----

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  action?: string;
}

type Step = "chat" | "dataset" | "code" | "scan" | "training" | "done";

interface TrainingEvent {
  type: string;
  message: string;
  color: string;
}

interface EvalResult {
  version: number;
  accuracy: number;
  f1: number;
  loss: number;
  note: string;
}

// ---- Component ----

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("chat");
  const [isStreaming, setIsStreaming] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const taskDescriptionRef = useRef("");

  // Action state
  const [datasetLoading, setDatasetLoading] = useState(false);
  const [dataset, setDataset] = useState<Array<{ input: string; output: string }>>([]);
  const [codeLoading, setCodeLoading] = useState(false);
  const [code, setCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null);
  const [trainingActive, setTrainingActive] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [trainingStep, setTrainingStep] = useState(0);
  const [trainingTotalSteps, setTrainingTotalSteps] = useState(300);
  const [trainingLoss, setTrainingLoss] = useState(0);
  const [trainingLR, setTrainingLR] = useState(0);
  const [trainingEvents, setTrainingEvents] = useState<TrainingEvent[]>([]);
  const [trainingStatus, setTrainingStatus] = useState("");
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [deliveryData, setDeliveryData] = useState<Record<string, unknown> | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const hasMessages = messages.length > 0;

  const newId = () => `msg-${++idCounter.current}`;

  // Auto-scroll chat panel
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-scroll workspace panel
  useEffect(() => {
    if (workspaceScrollRef.current) {
      workspaceScrollRef.current.scrollTop = workspaceScrollRef.current.scrollHeight;
    }
  }, [dataset, code, scanResult, trainingProgress, evalResults, deliveryData]);

  // ---- Handle actions from Eve's stream ----

  const datasetRef = useRef<Array<{ input: string; output: string }>>([]);

  const handleAction = useCallback(
    async (actionType: string) => {
      const task = taskDescriptionRef.current;
      if (actionType === "GENERATE_DATASET") {
        setStep("dataset");
        setDatasetLoading(true);
        try {
          const res = await generateDataset({
            task,
            description: task,
            num_examples: 20,
          });
          const examples = res.examples || [];
          setDataset(examples);
          datasetRef.current = examples;
        } catch {
          setDataset([]);
        }
        setDatasetLoading(false);
      } else if (actionType === "GENERATE_CODE") {
        setStep("code");
        setCodeLoading(true);
        try {
          const res = await generateCode({
            task,
            base_model: "Llama 3.1 8B",
            dataset_sample: datasetRef.current.slice(0, 3),
          });
          setCode(res.code || "# Error generating code");
        } catch {
          setCode("# Error generating code");
        }
        setCodeLoading(false);
      } else if (actionType === "SCAN_GPU") {
        setStep("scan");
        setScanLoading(true);
        try {
          const res = await scanGPU();
          setScanResult(res.best || res);
        } catch {
          setScanResult(null);
        }
        setScanLoading(false);
      } else if (actionType === "START_TRAINING") {
        setStep("training");
        startTraining();
      }
    },
    []
  );

  // ---- Send message ----

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      if (messages.length === 0) {
        setTaskDescription(content);
        taskDescriptionRef.current = content;
      }

      const userMsg: Message = { id: newId(), role: "user", content };
      const assistantMsg: Message = {
        id: newId(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamChat(apiMessages, {
        onToken: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content + text }
                : m
            )
          );
        },
        onAction: (type) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, action: type } : m
            )
          );
          handleAction(type);
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
            )
          );
          setIsStreaming(false);
        },
        onError: (msg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content || `Error: ${msg}`, isStreaming: false }
                : m
            )
          );
          setIsStreaming(false);
        },
      });
    },
    [messages, isStreaming, handleAction]
  );

  // ---- Dataset approved ----
  const handleDatasetApproved = () => {
    sendMessage("Dataset approved. Generate the training code.");
  };

  const handleDatasetRegenerate = async () => {
    setDatasetLoading(true);
    try {
      const res = await generateDataset({
        task: taskDescriptionRef.current,
        description: taskDescriptionRef.current,
        num_examples: 20,
      });
      const examples = res.examples || [];
      setDataset(examples);
      datasetRef.current = examples;
    } catch {
      // keep existing
    }
    setDatasetLoading(false);
  };

  const handleCodeDeploy = () => {
    sendMessage("Code looks good. Find the best GPU.");
  };

  const handleScanDeploy = () => {
    sendMessage("Deploy to this GPU. Start training.");
  };

  // ---- Training ----
  const startTraining = async () => {
    setTrainingActive(true);
    setTrainingEvents([]);
    setEvalResults([]);
    setDeliveryData(null);

    await streamDeploy(
      {
        dataset: datasetRef.current,
        task: taskDescriptionRef.current,
      },
      {
        onStatus: (data) => {
          setTrainingStatus(data.message);
          setTrainingProgress(data.progress);
        },
        onLog: (data) => {
          setTrainingEpoch(data.epoch);
          setTrainingStep(data.step);
          setTrainingTotalSteps(data.total_steps);
          setTrainingLoss(data.loss);
          setTrainingLR(data.lr);
          setTrainingProgress(data.progress);
        },
        onCheckpoint: (data) => {
          setTrainingEvents((prev) => [
            ...prev,
            {
              type: "checkpoint",
              message: `\u2713 Checkpoint saved at step ${data.step} (${data.size_gb} GB)`,
              color: "text-primary",
            },
          ]);
        },
        onEviction: (data) => {
          setTrainingEvents((prev) => [
            ...prev,
            {
              type: "eviction",
              message: `\u26a0 EVICTION \u2014 Migrating from ${data.from_az} to ${data.to_az}...`,
              color: "text-amber-400",
            },
          ]);
        },
        onMigrated: (data) => {
          setTrainingEvents((prev) => [
            ...prev,
            {
              type: "migrated",
              message: `\u2713 Restored in ${data.recovery_sec}s. Zero data loss.`,
              color: "text-primary",
            },
          ]);
        },
        onEval: (data) => {
          setEvalResults((prev) => [...prev, data]);
          setTrainingProgress(data.version === 1 ? 85 : 95);
        },
        onComplete: (data) => {
          setTrainingActive(false);
          setTrainingProgress(100);
          setTrainingStatus("Complete");
          setStep("done");
          setDeliveryData(data);
          setTrainingEvents((prev) => [
            ...prev,
            {
              type: "complete",
              message: `\u2713 Training complete \u2014 ${data.accuracy}% accuracy`,
              color: "text-primary",
            },
          ]);
        },
      }
    );
  };

  void taskDescription;

  // ---- Determine which action cards to show in right panel ----
  const lastActionMsg = [...messages].reverse().find((m) => m.action);
  const currentAction = lastActionMsg?.action;

  // ---- Render ----

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          /* ========== VIEW 1: LANDING ========== */
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Mesh gradient blobs — layered for depth */}
            <div className="mesh-blob mesh-blob-gold animate-float-drift" style={{ width: 700, height: 700, top: '-5%', left: '5%' }} />
            <div className="mesh-blob mesh-blob-yellow animate-float-slow" style={{ width: 550, height: 550, top: '15%', right: '0%' }} />
            <div className="mesh-blob mesh-blob-blue animate-float-slower" style={{ width: 400, height: 400, top: '25%', right: '15%' }} />
            <div className="mesh-blob mesh-blob-warm animate-float-slow" style={{ width: 500, height: 500, bottom: '5%', left: '30%' }} />
            <div className="mesh-blob mesh-blob-yellow animate-float-drift" style={{ width: 300, height: 300, bottom: '20%', right: '5%' }} />

            <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl sm:text-5xl font-bold text-center tracking-tight mb-3"
              >
                What do you want to <span className="text-shimmer">build</span>?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-base text-muted-foreground text-center mb-10 max-w-md mx-auto"
              >
                Describe your AI model in plain language. Eve handles dataset, code, GPU, training, and deployment.
              </motion.p>

              {/* Floating input */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <InputBar
                  onSend={sendMessage}
                  disabled={isStreaming}
                  placeholder="Describe the AI you want to build..."
                  variant="landing"
                />
              </motion.div>

              {/* Subtle hints */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-6 mt-10"
              >
                {["Sentiment classifier", "Document summarizer", "Code reviewer"].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => sendMessage(hint)}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 px-3 py-1.5 rounded-full transition-all hover:bg-primary/5 hover:shadow-[0_0_16px_rgba(234,179,8,0.15)]"
                  >
                    {hint}
                  </button>
                ))}
              </motion.div>
            </div>

            <p className="absolute bottom-6 text-[10px] text-muted-foreground/40 tracking-widest uppercase">
              Europe Hack 2026
            </p>
          </motion.div>
        ) : (
          /* ========== VIEW 2: SPLIT WORKSPACE ========== */
          <motion.div
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-12 border-b border-border bg-white flex items-center justify-between px-5 shrink-0 header-glow">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center avatar-glow">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground tracking-tight">EVE</span>
                </div>
                <div className="w-px h-5 bg-border" />
                <StepIndicator currentStep={step} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {taskDescription.slice(0, 40)}{taskDescription.length > 40 ? '...' : ''}
                </span>
              </div>
            </div>

            {/* Split panels */}
            <div className="flex-1 flex overflow-hidden">
              {/* LEFT: Chat panel */}
              <div className="w-[35%] flex flex-col border-r border-border bg-white">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        isStreaming={msg.isStreaming && !msg.content}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t border-border p-3">
                  <InputBar
                    onSend={sendMessage}
                    disabled={isStreaming || trainingActive}
                    placeholder="Type a message..."
                    variant="compact"
                  />
                </div>
              </div>

              {/* RIGHT: Workspace panel */}
              <div className="w-[65%] flex flex-col bg-white">
                <div ref={workspaceScrollRef} className="flex-1 overflow-y-auto">
                  <div className="workspace-bg min-h-full">
                    {/* No action yet — empty state */}
                    {!currentAction && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center py-20">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                            <Sparkles className="w-6 h-6 text-primary/60" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Eve is analyzing your request...
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            Results will appear here as she works.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action cards */}
                    {currentAction && (
                      <div className="p-6 max-w-2xl mx-auto space-y-4">
                        {currentAction === "GENERATE_DATASET" && (
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <DatasetCard
                              examples={dataset}
                              loading={datasetLoading}
                              onApprove={!datasetLoading && dataset.length > 0 ? handleDatasetApproved : undefined}
                              onRegenerate={!datasetLoading ? handleDatasetRegenerate : undefined}
                            />
                          </motion.div>
                        )}

                        {currentAction === "GENERATE_CODE" && (
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <CodeCard
                              code={code}
                              loading={codeLoading}
                              onDeploy={!codeLoading && code ? handleCodeDeploy : undefined}
                            />
                          </motion.div>
                        )}

                        {currentAction === "SCAN_GPU" && (
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <ScanCard
                              result={scanResult as any}
                              loading={scanLoading}
                              onDeploy={!scanLoading && scanResult ? handleScanDeploy : undefined}
                            />
                          </motion.div>
                        )}

                        {currentAction === "START_TRAINING" && (
                          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <TrainingCard
                              progress={trainingProgress}
                              epoch={trainingEpoch}
                              step={trainingStep}
                              totalSteps={trainingTotalSteps}
                              loss={trainingLoss}
                              lr={trainingLR}
                              events={trainingEvents}
                              status={trainingStatus}
                            />
                            {evalResults.length > 0 && <EvalCard results={evalResults} />}
                            {deliveryData && (
                              <DeliveryCard
                                accuracy={(deliveryData.accuracy as number) || 94.2}
                                costUsd={(deliveryData.cost_usd as number) || 2.96}
                                co2Grams={(deliveryData.co2_grams as number) || 54}
                                totalTime={(deliveryData.total_time as string) || "42m"}
                                modelId={(deliveryData.model_id as string) || "eve-0001"}
                                task={taskDescription}
                                examples={dataset}
                              />
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
