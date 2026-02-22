import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type DashboardStats } from "@/lib/api";

const StatsSection = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.dashboardStats().then(setStats).catch(() => {});
  }, []);

  const items = stats
    ? [
        {
          value: `${stats.avg_savings_pct.toFixed(0)}%`,
          label: "Average cost savings",
        },
        {
          value: `${stats.total_jobs_managed}`,
          label: "Jobs orchestrated",
        },
        {
          value: `${(stats.total_co2_saved_grams / 1000).toFixed(1)} kg`,
          label: "CO₂ avoided",
        },
        {
          value: `${stats.regions_monitored.length}`,
          label: "Regions monitored",
        },
      ]
    : [
        { value: "~90%", label: "Average cost savings" },
        { value: "<30s", label: "Checkpoint & migrate" },
        { value: "99.9%", label: "Job uptime" },
        { value: "3", label: "Regions monitored" },
      ];

  return (
    <section className="border-y border-border bg-white">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="mb-1 font-mono text-3xl font-bold text-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
