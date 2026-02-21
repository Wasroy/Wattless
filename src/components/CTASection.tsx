import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="relative border-t border-border py-24">
    <div className="absolute inset-0 bg-hero-gradient" />
    <div className="container relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          Prêt à réduire vos coûts ?
        </h2>
        <p className="mb-8 text-muted-foreground">
          Déployez Nerve en 5 minutes sur votre cluster Kubernetes et commencez à économiser immédiatement.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2 px-8 text-base font-semibold">
            Démarrer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="px-8 text-base">
            Réserver une démo
          </Button>
        </div>
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Open-source · Helm chart · Compatible EKS, GKE, AKS
        </p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
