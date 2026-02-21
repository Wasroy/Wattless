import { motion } from "framer-motion";
import { Shield, DollarSign, Leaf, Gauge, Boxes, Globe } from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Jusqu'à -90% de coût",
    description: "Exécutez vos workloads IA, data et rendu sur les Spot les moins chères, automatiquement.",
  },
  {
    icon: Shield,
    title: "Stabilité on-demand",
    description: "Prédiction d'interruption + rescheduling instantané : vos jobs ne tombent jamais.",
  },
  {
    icon: Gauge,
    title: "Zero config",
    description: "Un Helm chart, des annotations — Nerve s'intègre à votre cluster en 5 minutes.",
  },
  {
    icon: Boxes,
    title: "Multi-workload",
    description: "IA training, data pipelines, rendu 3D, CI/CD : tout ce qui est batch ou stateless.",
  },
  {
    icon: Globe,
    title: "Intra-région",
    description: "Nerve cherche les spots dans toutes les AZ de votre région — latence minimale garantie.",
  },
  {
    icon: Leaf,
    title: "GreenOps (V2)",
    description: "Time-shifting selon l'intensité carbone locale pour réduire l'empreinte CO₂ de vos workloads.",
  },
];

const FeaturesSection = () => (
  <section id="features" className="relative border-t border-border py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-4 inline-block font-mono text-sm text-primary">// Features</span>
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
          Construit pour le <span className="text-gradient-green">cloud moderne</span>
        </h2>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/20"
          >
            <feature.icon className="mb-4 h-6 w-6 text-primary" />
            <h3 className="mb-2 font-semibold">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
