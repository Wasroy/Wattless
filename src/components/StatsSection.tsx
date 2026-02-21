import { motion } from "framer-motion";

const stats = [
  { value: "~90%", label: "Réduction des coûts compute", suffix: "" },
  { value: "<3s", label: "Temps de rescheduling", suffix: "" },
  { value: "99.9%", label: "Taux de complétion des jobs", suffix: "" },
  { value: "0", label: "Ligne de code à changer", suffix: "" },
];

const StatsSection = () => (
  <section className="relative border-y border-border bg-secondary/30">
    <div className="container py-16">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="mb-2 font-mono text-4xl font-bold text-gradient-green md:text-5xl">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
