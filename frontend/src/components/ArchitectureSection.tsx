import { motion } from "framer-motion";

const nodes = [
  { label: "You run one command", sub: "nerve deploy model.py", num: "01" },
  { label: "We scan everywhere", sub: "12 regions, real-time prices", num: "02" },
  { label: "Best GPU selected", sub: "cheapest + greenest", num: "03" },
  { label: "Training starts", sub: "auto-checkpoint every 30s", num: "04" },
  { label: "Eviction? No problem", sub: "cloud pulls the plug", num: "05" },
  { label: "Instant migration", sub: "new GPU, 28s, nothing lost", num: "06" },
];

const ArchitectureSection = () => (
  <section className="py-24">
    <div className="container">
      <div className="text-center mb-16">
        <p className="text-xs font-medium text-emerald-600 tracking-widest uppercase mb-3">
          Pipeline
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          From command to training in 60 seconds
        </h2>
        <p className="text-zinc-400 text-sm">
          Here&rsquo;s what happens behind <code className="font-mono text-foreground bg-zinc-100 px-1.5 py-0.5 rounded text-xs">nerve deploy</code>
        </p>
      </div>

      {/* Horizontal flow on desktop, vertical on mobile */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {nodes.map((node, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              <div className="bg-white border border-zinc-100 rounded-xl p-4 text-center h-full hover:border-emerald-200 transition-colors">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold mb-3">
                  {node.num}
                </span>
                <p className="text-xs font-semibold text-foreground mb-1">{node.label}</p>
                <p className="font-mono text-[10px] text-zinc-400 leading-relaxed">{node.sub}</p>
              </div>

              {/* Arrow connector (hidden on last) */}
              {i < nodes.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 text-emerald-300">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <p className="inline-flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-medium">
            Your model doesn&rsquo;t know the difference. Your wallet does.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default ArchitectureSection;
