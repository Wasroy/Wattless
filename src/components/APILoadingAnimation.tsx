import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Cloud, Leaf, Zap, Cpu, CheckCircle2, Loader2 } from "lucide-react";

interface APIStep {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number;
}

const API_STEPS: APIStep[] = [
  { name: "Calling Azure Retail Prices API...", icon: Server, duration: 800 },
  { name: "Fetching Open-Meteo Weather API...", icon: Cloud, duration: 600 },
  { name: "Querying Carbon Intensity UK API...", icon: Leaf, duration: 700 },
  { name: "Analyzing RTE eCO2mix...", icon: Zap, duration: 500 },
  { name: "Computing optimal path...", icon: Cpu, duration: 1000 },
];

interface APILoadingAnimationProps {
  onComplete?: () => void;
}

const APILoadingAnimation = ({ onComplete }: APILoadingAnimationProps) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const processStep = () => {
      if (stepIndex >= API_STEPS.length) {
        if (onComplete) {
          onComplete();
        }
        return;
      }

      setCurrentStep(stepIndex);
      
      timeoutId = setTimeout(() => {
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));
        stepIndex++;
        processStep();
      }, API_STEPS[stepIndex].duration);
    };

    processStep();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onComplete]);

  return (
    <div className="space-y-3">
      {API_STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(index);
        const isCurrent = currentStep === index && !isCompleted;
        const Icon = step.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: isCurrent || isCompleted ? 1 : 0.4,
              x: 0 
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50 border border-zinc-100"
          >
            <div className="flex-shrink-0">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </motion.div>
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              ) : (
                <Icon className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                isCompleted
                  ? "text-emerald-700"
                  : isCurrent
                  ? "text-zinc-900"
                  : "text-zinc-400"
              }`}
            >
              {step.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default APILoadingAnimation;
