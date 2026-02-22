const steps = [
  { key: "chat", label: "Chat" },
  { key: "dataset", label: "Data" },
  { key: "code", label: "Code" },
  { key: "scan", label: "GPU" },
  { key: "training", label: "Train" },
  { key: "done", label: "Done" },
];

interface StepIndicatorProps {
  currentStep: string;
}

const stepIndex = (step: string) => steps.findIndex((s) => s.key === step);

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const current = stepIndex(currentStep);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isActive = i === current;
        const isDone = i < current;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isDone
                    ? "bg-primary"
                    : isActive
                    ? "bg-primary ring-[3px] ring-primary/20"
                    : "bg-border"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isDone || isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-4 h-px mx-1 transition-colors ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
