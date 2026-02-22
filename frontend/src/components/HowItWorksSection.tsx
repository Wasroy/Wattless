import { motion } from "framer-motion";

const painPoints = [
  {
    before: "You launch a training run on on-demand. It costs $3.67/h per GPU. For 8 GPUs over 3 hours, that's $88.",
    after: "NERVE grabs Spot GPUs at $0.31/h. Same run, same results. $7.44 total.",
    label: "Cost",
    savings: "$80 saved",
  },
  {
    before: "Cloud evicts your instance mid-training. 6 hours of progress — gone. You start over, pay twice.",
    after: "NERVE checkpoints every 30s. Eviction hits? New GPU in 28s. You don't even notice.",
    label: "Reliability",
    savings: "0 data lost",
  },
  {
    before: "You pick a region randomly. Your training emits 19 kg of CO\u2082. Nobody tracks it, nobody cares.",
    after: "NERVE routes to the greenest region automatically. 2.1 kg CO\u2082. Same model, 89% less carbon.",
    label: "Carbon",
    savings: "89% greener",
  },
];

const HowItWorksSection = () => (
  <section className="py-24 bg-zinc-50">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-xs font-medium text-emerald-600 tracking-widest uppercase mb-3">
          The reality
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Three things you&rsquo;re getting wrong
        </h2>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto">
          Every ML team makes the same mistakes. Here&rsquo;s what happens when you stop.
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-5">
        {painPoints.map((point, i) => (
          <motion.div
            key={point.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-zinc-100 overflow-hidden"
          >
            <div className="grid md:grid-cols-2">
              {/* Before */}
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Without NERVE</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{point.before}</p>
              </div>

              {/* After */}
              <div className="p-6 md:p-8 bg-emerald-50/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">With NERVE</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{point.savings}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">{point.after}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
