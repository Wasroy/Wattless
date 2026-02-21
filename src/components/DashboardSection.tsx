import { motion } from "framer-motion";

const DashboardSection = () => (
  <section id="dashboard" className="relative border-t border-border py-24">
    <div className="container">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <span className="mb-4 inline-block font-mono text-sm text-primary">// Dashboard FinOps</span>
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          Chaque dollar compte
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Visualisez vos économies en temps réel, les interruptions évitées, et bientôt votre empreinte carbone.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border glow-border"
      >
        {/* Mock dashboard */}
        <div className="border-b border-border bg-secondary/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse-glow" />
            <span className="font-mono text-sm text-muted-foreground">nerve-dashboard — live</span>
          </div>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-3">
          {[
            { label: "Économisé ce mois", value: "$12,847", trend: "+23%" },
            { label: "Interruptions évitées", value: "142", trend: "100%" },
            { label: "Uptime des jobs", value: "99.97%", trend: "stable" },
          ].map((metric) => (
            <div key={metric.label} className="bg-card p-8">
              <div className="mb-1 text-xs text-muted-foreground">{metric.label}</div>
              <div className="font-mono text-3xl font-bold text-gradient-green">{metric.value}</div>
              <div className="mt-1 font-mono text-xs text-primary">{metric.trend}</div>
            </div>
          ))}
        </div>
        <div className="bg-card p-8">
          <div className="mb-4 text-xs text-muted-foreground">Économies sur 7 jours</div>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {[40, 65, 55, 80, 72, 90, 85].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="flex-1 rounded-t bg-primary/80 transition-colors hover:bg-primary"
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default DashboardSection;
