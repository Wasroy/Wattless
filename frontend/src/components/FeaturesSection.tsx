import { motion } from "framer-motion";
import { Search, Cpu, Shield, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  command: string;
}

const features: Feature[] = [
  {
    icon: Search,
    title: "Hunt the cheapest GPU",
    description: "Prices change every minute. NERVE watches 12 regions, 60-second intervals, and picks the winner.",
    metric: "12",
    metricLabel: "regions",
    command: "nerve scan --gpu a100 --regions all",
  },
  {
    icon: Cpu,
    title: "Deploy in one line",
    description: "Point it at your training script. NERVE handles the VM, the GPU, the region, the pricing.",
    metric: "$0.31",
    metricLabel: "/h",
    command: "nerve deploy --region uksouth",
  },
  {
    icon: Shield,
    title: "Never lose progress",
    description: "Checkpoints every 30s. If the cloud pulls the rug, you're back on a new GPU before your coffee cools.",
    metric: "28s",
    metricLabel: "recovery",
    command: "checkpoint saved (2.1 GB)",
  },
  {
    icon: Clock,
    title: "Train when it's cheap",
    description: "Set a deadline. NERVE finds the window where prices and carbon are both at their lowest.",
    metric: "40%",
    metricLabel: "extra saved",
    command: "nerve timeshift --deadline 24h",
  },
];

const FeaturesSection = () => (
  <section className="py-24 bg-zinc-50">
    <div className="container">
      <div className="text-center mb-16">
        <p className="text-xs font-medium text-emerald-600 tracking-widest uppercase mb-3">
          What NERVE does
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          The boring parts, automated.
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl p-6 border border-zinc-100 group hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300"
          >
            <div className="bg-emerald-50 w-9 h-9 rounded-xl flex items-center justify-center mb-5">
              <f.icon className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">
                {f.metric}
              </span>
              <span className="text-sm text-zinc-400 ml-1">
                {f.metricLabel}
              </span>
            </div>

            <h3 className="text-foreground text-sm font-semibold mb-1.5">
              {f.title}
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              {f.description}
            </p>

            <div className="font-mono text-[10px] text-zinc-300 group-hover:text-emerald-600/50 transition-colors">
              $ {f.command}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
