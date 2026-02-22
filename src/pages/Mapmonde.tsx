import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TrendingUp, DollarSign, Thermometer, Leaf, Shield, ArrowRight, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorldMap from "@/components/WorldMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServerTransitions } from "@/hooks/useServerTransitions";

// Import des données depuis les fichiers JSON
import nerveServeursData from "@/data/nerve_servers.json";
import transitionsData from "@/data/transitions.json";
import type { Serveur } from "@/data/types";

// Type pour les gains financiers
interface FinancialGain {
  amount_usd: number;
  amount_eur: number;
  source: string;
  reason: string;
}

interface TransitionWithReasons {
  from: string;
  to: string;
  savings: number;
  financial_gains: FinancialGain[];
  total_gain_eur: number;
  summary: string;
  id: string;
  expiresAt: number;
}

// Extraire le nom court de la ville depuis le nom complet du serveur
const extractCity = (fullName: string): string => {
  const parts = fullName.split(" - ");
  if (parts.length > 1) {
    return parts[1].split(",")[0].trim().replace(" (Gov)", "");
  }
  return fullName.slice(0, 20);
};

// Icône et couleur par source de gain
const SOURCE_CONFIG: Record<string, { icon: typeof DollarSign; color: string; bg: string; glow: string }> = {
  price: { icon: DollarSign, color: "text-green-400", bg: "bg-green-500/15", glow: "shadow-green-500/20" },
  weather: { icon: Thermometer, color: "text-cyan-400", bg: "bg-cyan-500/15", glow: "shadow-cyan-500/20" },
  carbon: { icon: Leaf, color: "text-emerald-400", bg: "bg-emerald-500/15", glow: "shadow-emerald-500/20" },
  availability: { icon: Shield, color: "text-violet-400", bg: "bg-violet-500/15", glow: "shadow-violet-500/20" },
};

// Préparer la liste complète de tous les serveurs depuis le catalogue NERVE
const allServeurs: Serveur[] = nerveServeursData.map((s) => ({
  name: s.name,
  coordinates: s.coordinates as [number, number],
  status: (s.status || "online") as "online" | "maintenance" | "offline",
  region: s.region,
  latency: s.latency || "50ms",
}));

// Index des transitions par clé from+to pour lookup rapide
const transitionsIndex = new Map<string, (typeof transitionsData)[0]>();
transitionsData.forEach((t) => {
  transitionsIndex.set(`${t.from}|||${t.to}`, t);
});

const Mapmonde = () => {
  const { activeTransitions, addTransition } = useServerTransitions();
  const [totalSavings, setTotalSavings] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);
  const processedTransitionsRef = useRef<Set<string>>(new Set());
  const [liveReasons, setLiveReasons] = useState<TransitionWithReasons[]>([]);
  const [transitionCount, setTransitionCount] = useState(0);

  // Charger et déclencher les transitions depuis le JSON
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    transitionsData.forEach((transition, index) => {
      const timeout = setTimeout(() => {
        // Durée aléatoire entre 1000ms (1s) et 2000ms (2s) MAX
        const duration = Math.min(Math.floor(Math.random() * 1000) + 1000, 2000);
        
        // Créer une clé unique pour cette transition basée sur l'index et les données
        const transitionKey = `${transition.from}-${transition.to}-${transition.timestamp}-${index}`;
        
        // Vérifier si cette transition a déjà été comptabilisée
        if (!processedTransitionsRef.current.has(transitionKey)) {
          setTotalSavings((prev) => prev + (transition.savings || 0));
          processedTransitionsRef.current.add(transitionKey);
          setShouldPulse(true);
          setTimeout(() => setShouldPulse(false), 600);
          setTransitionCount((prev) => prev + 1);
        }
        
        addTransition(transition.from, transition.to, duration, transition.savings);

        // Ajouter la raison financière animée
        const reasonCard: TransitionWithReasons = {
          from: transition.from,
          to: transition.to,
          savings: transition.savings || 0,
          financial_gains: (transition as any).financial_gains || [],
          total_gain_eur: (transition as any).total_gain_eur || transition.savings || 0,
          summary: (transition as any).summary || "",
          id: transitionKey,
          expiresAt: Date.now() + 4000, // visible 4s
        };

        setLiveReasons((prev) => {
          // Garder max 3 cartes visibles
          const next = [...prev, reasonCard];
          return next.slice(-3);
        });

        // Retirer la carte après 4s
        setTimeout(() => {
          setLiveReasons((prev) => prev.filter((r) => r.id !== transitionKey));
        }, 4000);
      }, transition.timestamp);

      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [addTransition]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {/* World Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Carte des serveurs</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-500 opacity-60" />
                    Inactif
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    Transition active
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Maintenance
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Offline
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-lg border border-border bg-[#0d0d1a] overflow-hidden relative">

                {/* ── TOP-LEFT OVERLAY ─────────────────────────── */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[340px] pointer-events-none">

                  {/* Total économies + compteur */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                  >
                    <motion.div
                      className="bg-background/95 backdrop-blur-md border border-green-500/30 rounded-xl px-4 py-3 shadow-lg shadow-green-500/5"
                      animate={{
                        scale: shouldPulse ? [1, 1.04, 1] : 1,
                        borderColor: shouldPulse
                          ? ["rgba(34,197,94,0.3)", "rgba(34,197,94,0.7)", "rgba(34,197,94,0.3)"]
                          : "rgba(34,197,94,0.3)",
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Économies temps réel</span>
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={totalSavings.toFixed(2)}
                                initial={{ scale: 1.3, opacity: 0, y: -8 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.8, opacity: 0, y: 8 }}
                                transition={{ duration: 0.25, ease: "backOut" }}
                                className="text-xl font-black font-mono text-green-400 tabular-nums"
                              >
                                +{totalSavings.toFixed(2)}€
                              </motion.span>
                            </AnimatePresence>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground">Transitions</span>
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={transitionCount}
                              initial={{ scale: 1.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-sm font-bold font-mono text-white/80 tabular-nums"
                            >
                              {transitionCount}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* ── LIVE REASON CARDS ────────────────────────── */}
                  <AnimatePresence mode="popLayout">
                    {liveReasons.map((reason) => (
                      <motion.div
                        key={reason.id}
                        layout
                        initial={{ opacity: 0, x: -60, scale: 0.85, filter: "blur(8px)" }}
                        animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -40, scale: 0.9, filter: "blur(6px)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      >
                        <div className="bg-background/90 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-xl shadow-black/20 overflow-hidden relative">
                          {/* Glow accent bar */}
                          <motion.div
                            className="absolute top-0 left-0 h-full w-[3px] rounded-full bg-gradient-to-b from-green-400 via-cyan-400 to-violet-400"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          />

                          {/* Header: from → to */}
                          <div className="flex items-center gap-1.5 mb-2 pl-2">
                            <motion.div
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10"
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              <Zap className="h-3 w-3 text-primary" />
                            </motion.div>
                            <span className="text-[11px] font-semibold text-white/90 truncate max-w-[120px]">
                              {extractCity(reason.from)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-white/90 truncate max-w-[120px]">
                              {extractCity(reason.to)}
                            </span>
                          </div>

                          {/* Gain reasons */}
                          <div className="flex flex-col gap-1 pl-2">
                            {reason.financial_gains.map((gain, i) => {
                              const config = SOURCE_CONFIG[gain.source] || SOURCE_CONFIG.price;
                              const Icon = config.icon;
                              return (
                                <motion.div
                                  key={`${reason.id}-${gain.source}-${i}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
                                  className={`flex items-center gap-2 rounded-lg ${config.bg} px-2 py-1`}
                                >
                                  <Icon className={`h-3 w-3 ${config.color} flex-shrink-0`} />
                                  <span className={`text-[11px] font-bold font-mono ${config.color} tabular-nums flex-shrink-0`}>
                                    +{gain.amount_eur}€
                                  </span>
                                  <span className="text-[10px] text-white/60 truncate">
                                    {gain.source === "price" && "prix serveur"}
                                    {gain.source === "weather" && "météo & cooling"}
                                    {gain.source === "carbon" && "carbone vert"}
                                    {gain.source === "availability" && "disponibilité"}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Total bar */}
                          <motion.div
                            className="mt-2 pl-2 flex items-center justify-between"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <span className="text-[10px] text-muted-foreground font-medium">Total gain</span>
                            <motion.span
                              className="text-sm font-black font-mono text-green-400"
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                            >
                              +{reason.total_gain_eur}€
                            </motion.span>
                          </motion.div>

                          {/* Progress bar that shrinks as card expires */}
                          <motion.div
                            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-green-400 via-cyan-400 to-violet-400"
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 4, ease: "linear" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* ── TOP-RIGHT: LIVE INDICATOR ──────────────────── */}
                <AnimatePresence>
                  {activeTransitions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute top-3 right-3 z-10"
                    >
                      <div className="bg-background/90 backdrop-blur-md border border-primary/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <motion.div
                          className="h-2 w-2 rounded-full bg-green-400"
                          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <span className="text-[11px] font-medium text-white/80">
                          {activeTransitions.length} migration{activeTransitions.length > 1 ? "s" : ""} active{activeTransitions.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <WorldMap 
                  serveurs={allServeurs} 
                  allServeursColor={true}
                  activeTransitions={activeTransitions}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Serveur List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Liste des serveurs
              </CardTitle>
              <CardDescription>Tous les points d'infrastructure du réseau</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allServeurs.map((dc) => (
                  <div
                    key={dc.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          dc.status === "online"
                            ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                            : dc.status === "maintenance"
                            ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium">{dc.name}</div>
                        <div className="text-xs text-muted-foreground">{dc.region}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{dc.latency}</span>
                      <Badge
                        variant={dc.status === "online" ? "default" : "secondary"}
                        className={dc.status === "online" ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" : ""}
                      >
                        {dc.status === "online" ? "Online" : dc.status === "maintenance" ? "Maint." : "Offline"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Mapmonde;
