import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Thermometer, Leaf, Shield, ArrowRight, Zap } from "lucide-react";

// Types
interface FinancialGain {
  amount_usd: number;
  amount_eur: number;
  source: string;
  reason: string;
}

interface TransitionWithReasons {
  from: string;
  to: string;
  savings: number;
  financial_gains: FinancialGain[];
  total_gain_eur: number;
  summary: string;
  id: string;
  expiresAt: number;
}

interface TransitionPanelProps {
  totalSavings: number;
  shouldPulse: boolean;
  transitionCount: number;
  activeCount: number;
  liveReasons: TransitionWithReasons[];
}

// Extraire le nom court de la ville
const extractCity = (fullName: string): string => {
  const parts = fullName.split(" - ");
  if (parts.length > 1) {
    return parts[1].split(",")[0].trim().replace(" (Gov)", "");
  }
  return fullName.slice(0, 20);
};

// Icône Euro simple
const EuroIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold', display: 'inline-block', transform: 'translateY(-5px)' }}>€</span>
);

// Icône et couleur par source de gain
const SOURCE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  price: { icon: EuroIcon, color: "text-green-600", bg: "bg-green-500/10" },
  weather: { icon: Thermometer, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  carbon: { icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  availability: { icon: Shield, color: "text-violet-600", bg: "bg-violet-500/10" },
};

const TransitionPanel = ({
  totalSavings,
  shouldPulse,
  transitionCount,
  activeCount,
  liveReasons,
}: TransitionPanelProps) => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 shrink-0">
        <Zap className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
          Live Transitions
        </span>
      </div>

      {/* Savings + Counter */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <motion.div
          className="border border-green-500/30 rounded-xl px-4 py-3 shadow-sm"
          animate={{
            scale: shouldPulse ? [1, 1.02, 1] : 1,
            borderColor: shouldPulse
              ? ["rgba(34,197,94,0.3)", "rgba(34,197,94,0.7)", "rgba(34,197,94,0.3)"]
              : "rgba(34,197,94,0.3)",
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15 shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Last Hour</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={totalSavings.toFixed(2)}
                  initial={{ scale: 1.3, opacity: 0, y: -6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 6 }}
                  transition={{ duration: 0.25, ease: "backOut" }}
                  className="text-lg font-black font-mono text-green-600 tabular-nums"
                >
                  +{totalSavings.toFixed(2)}€
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Reason Cards */}
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {liveReasons.map((reason) => (
              <motion.div
                key={reason.id}
                layout
                initial={{ opacity: 0, x: -40, scale: 0.85, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -30, scale: 0.9, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="bg-zinc-50/80 border border-zinc-100 rounded-xl p-3 overflow-hidden relative">
                  {/* Glow accent bar */}
                  <motion.div
                    className="absolute top-0 left-0 h-full w-[3px] rounded-full bg-gradient-to-b from-green-500 via-cyan-500 to-violet-500"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  />

                  {/* Header: from → to */}
                  <div className="flex items-center gap-1.5 mb-2 pl-2">
                    <motion.div
                      className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 shrink-0"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Zap className="h-3 w-3 text-emerald-600" />
                    </motion.div>
                    <span className="text-[11px] font-semibold text-zinc-800 truncate">
                      {extractCity(reason.from)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-zinc-800 truncate">
                      {extractCity(reason.to)}
                    </span>
                  </div>

                  {/* Gain reasons */}
                  <div className="flex flex-col gap-1 pl-2">
                    {reason.financial_gains.map((gain, i) => {
                      const config = SOURCE_CONFIG[gain.source] || SOURCE_CONFIG.price;
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={`${reason.id}-${gain.source}-${i}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
                          className={`flex items-center gap-2 rounded-lg ${config.bg} px-2 py-1`}
                        >
                          <Icon className={`h-3 w-3 ${config.color} flex-shrink-0`} />
                          <span className={`text-[11px] font-bold font-mono ${config.color} tabular-nums flex-shrink-0`}>
                            +{gain.amount_eur}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate">
                            {gain.source === "price" && "server price"}
                            {gain.source === "weather" && "weather & cooling"}
                            {gain.source === "carbon" && "green carbon"}
                            {gain.source === "availability" && "availability"}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Total bar */}
                  <motion.div
                    className="mt-2 pl-2 flex items-center justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-[10px] text-zinc-500 font-medium">Total gain</span>
                    <motion.span
                      className="text-sm font-black font-mono text-green-600"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                    >
                      +{reason.total_gain_eur}€
                    </motion.span>
                  </motion.div>

                  {/* Progress bar that shrinks as card expires */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-green-500 via-cyan-500 to-violet-500"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {liveReasons.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Zap className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="text-xs text-zinc-400">Waiting for next transition...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitionPanel;
