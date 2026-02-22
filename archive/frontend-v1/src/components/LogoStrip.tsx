import { motion } from "framer-motion";

const logos = [
  { name: "Azure", icon: "☁️" },
  { name: "Kubernetes", icon: "⎈" },
  { name: "PyTorch", icon: "🔥" },
  { name: "Docker", icon: "🐳" },
  { name: "FastAPI", icon: "⚡" },
  { name: "HuggingFace", icon: "🤗" },
];

const LogoStrip = () => (
  <section className="border-y border-border bg-muted/30 py-6">
    <div className="container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex flex-col sm:flex-row items-center gap-6"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          Built on
        </span>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-lg">{logo.icon}</span>
              <span className="font-mono text-sm font-medium">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default LogoStrip;
