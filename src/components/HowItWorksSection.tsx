import { motion } from "framer-motion";
import { Search, Cpu, ShieldAlert, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Intercept",
    description: "Nerve détecte automatiquement les pods batch/stateless éligibles au Spot via des labels ou annotations.",
  },
  {
    icon: Cpu,
    title: "Place",
    description: "Le scheduler choisit la Spot Instance la moins chère dans votre région, en respectant vos contraintes (GPU, mémoire…).",
  },
  {
    icon: ShieldAlert,
    title: "Protect",
    description: "En cas d'interruption prédite ou signalée, cordon + drain + rescheduling automatique en <3 secondes.",
  },
  {
    icon: BarChart3,
    title: "Report",
    description: "Dashboard FinOps en temps réel : $ économisés, interruptions évitées, et bientôt CO₂ réduit.",
  },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="relative py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-4 inline-block font-mono text-sm text-primary">// Comment ça marche</span>
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
          Quatre étapes. Zéro friction.
        </h2>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:glow-border"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <step.icon className="h-5 w-5" />
            </div>
            <div className="mb-1 font-mono text-xs text-muted-foreground">0{i + 1}</div>
            <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
