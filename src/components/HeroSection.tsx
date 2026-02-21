import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => (
  <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
    {/* Background */}
    <div className="absolute inset-0">
      <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-grid opacity-30" />
    </div>

    <div className="container relative z-10 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mx-auto max-w-4xl text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5"
        >
          <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
          <span className="font-mono text-xs text-muted-foreground">Orchestrateur Kubernetes Spot</span>
        </motion.div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl">
          Vos workloads.{" "}
          <span className="text-gradient-green">-90% de coût.</span>
          <br />
          Zéro interruption.
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          WATTLESS Nerve intercepte vos pods batch et les exécute sur les Spot Instances les moins chères — 
          avec un rescheduling automatique en cas d'interruption.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2 px-8 text-base font-semibold">
            Déployer Nerve
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="gap-2 px-8 text-base">
            <Terminal className="h-4 w-4" />
            helm install watless/nerve
          </Button>
        </div>

        {/* Terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-lg border border-border glow-border"
        >
          <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2.5">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-primary/40" />
            <div className="h-3 w-3 rounded-full bg-primary/60" />
            <span className="ml-2 font-mono text-xs text-muted-foreground">nerve-controller</span>
          </div>
          <div className="bg-card/80 p-5 text-left font-mono text-sm leading-7 text-muted-foreground">
            <p><span className="text-primary">$</span> nerve intercept pod/ml-training-7x4k</p>
            <p className="text-foreground">→ Spot c5.2xlarge trouvé — <span className="text-primary">$0.12/h</span> vs $0.68/h on-demand</p>
            <p className="text-foreground">→ Scheduling sur <span className="text-primary">eu-west-1b</span></p>
            <p>⚡ Interruption détectée dans 120s…</p>
            <p className="text-foreground">→ Cordon + Drain + Reschedule → <span className="text-primary">0s downtime</span></p>
            <p className="text-primary">✓ Job terminé. $47.20 économisés.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
