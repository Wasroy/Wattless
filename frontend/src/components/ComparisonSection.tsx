import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const rows = [
  { metric: "GPU cost", without: "$3.67/h x 8", with: "$0.31/h x 8", saved: "-91.6%" },
  { metric: "Total cost", without: "$88.08", with: "$7.44", saved: "-$80.64" },
  { metric: "Eviction", without: "Crash, restart from 0", with: "Checkpoint + migrate 28s", saved: "0 loss" },
  { metric: "Carbon", without: "19.0 kg CO\u2082", with: "2.1 kg CO\u2082", saved: "-89%" },
  { metric: "Region", without: "Manual", with: "Auto across 12 regions", saved: "Auto" },
];

const ComparisonSection = () => {
  const [showNerve, setShowNerve] = useState(false);

  return (
    <section className="py-24 bg-zinc-950 text-white">
      <div className="container text-center">
        <p className="text-xs font-medium text-emerald-400 tracking-widest uppercase mb-3">
          Real numbers
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-1">
          What if you fine-tuned Llama 70B right now?
        </h2>
        <p className="text-zinc-500 font-mono text-sm mb-14">
          8&times; A100 &middot; 3 hours &middot; West Europe
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm font-medium transition-colors ${!showNerve ? "text-white" : "text-zinc-600"}`}>
            On-demand
          </span>
          <button
            onClick={() => setShowNerve(!showNerve)}
            className={`relative h-8 w-14 rounded-full transition-colors ${showNerve ? "bg-emerald-600" : "bg-zinc-700"}`}
          >
            <motion.div
              animate={{ x: showNerve ? 26 : 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-[4px] h-[24px] w-[24px] rounded-full bg-white"
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${showNerve ? "text-white" : "text-zinc-600"}`}>
            NERVE
          </span>
        </div>

        {/* Price */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showNerve ? "on" : "off"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-14"
          >
            <span className={`text-7xl md:text-8xl font-bold tracking-tight ${showNerve ? "text-emerald-400" : "text-white"}`}>
              {showNerve ? "$7.44" : "$88.08"}
            </span>
            <p className="text-zinc-500 text-sm mt-3">
              {showNerve ? "with NERVE — same GPUs, same output" : "what you're paying today"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Table */}
        <div className="max-w-2xl mx-auto rounded-xl overflow-hidden border border-zinc-800">
          {rows.map((row, i) => (
            <div
              key={row.metric}
              className={`grid grid-cols-3 text-sm ${
                i < rows.length - 1 ? "border-b border-zinc-800" : ""
              }`}
            >
              <span className="text-zinc-500 px-5 py-3.5 text-left text-xs">
                {row.metric}
              </span>
              <span className={`font-mono text-xs px-5 py-3.5 text-right transition-colors ${
                showNerve ? "text-emerald-400" : "text-zinc-400"
              }`}>
                {showNerve ? row.with : row.without}
              </span>
              <span className="px-5 py-3.5 text-right text-xs">
                {showNerve ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 font-medium">
                    {row.saved}
                  </motion.span>
                ) : (
                  <span className="text-zinc-800">&mdash;</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
