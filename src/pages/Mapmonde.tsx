import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorldMap from "@/components/WorldMap";
import LiveDataFeed from "@/components/LiveDataFeed";
import TransitionPanel from "@/components/TransitionPanel";
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

// Préparer la liste complète de tous les serveurs depuis le catalogue NERVE
const allServeurs: Serveur[] = nerveServeursData.map((s) => ({
  name: s.name,
  coordinates: s.coordinates as [number, number],
  status: (s.status || "online") as "online" | "maintenance" | "offline",
  region: s.region,
  latency: s.latency || "50ms",
}));

const Mapmonde = () => {
  const { activeTransitions, addTransition } = useServerTransitions();
  
  // Calculer un total réaliste pour la dernière heure
  const allSavings = transitionsData.reduce((sum, t) => sum + (t.savings || 0), 0);
  const avgSavingsPerTransition = allSavings / transitionsData.length;
  const transitionsPerHour = 100;
  const lastHourSavings = avgSavingsPerTransition * transitionsPerHour;
  
  const initialTransitionCount = 247;
  
  const [totalSavings, setTotalSavings] = useState(Math.round(lastHourSavings * 100) / 100);
  const [shouldPulse, setShouldPulse] = useState(false);
  const processedTransitionsRef = useRef<Set<string>>(new Set());
  const [liveReasons, setLiveReasons] = useState<TransitionWithReasons[]>([]);
  const [transitionCount, setTransitionCount] = useState(initialTransitionCount);

  // Charger et déclencher les transitions depuis le JSON
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    transitionsData.forEach((transition, index) => {
      const timeout = setTimeout(() => {
        const duration = Math.min(Math.floor(Math.random() * 1000) + 1000, 2000);
        const transitionKey = `${transition.from}-${transition.to}-${transition.timestamp}-${index}`;
        
        if (!processedTransitionsRef.current.has(transitionKey)) {
          setTotalSavings((prev) => {
            const newTotal = prev + (transition.savings || 0);
            if (newTotal > lastHourSavings * 1.5) {
              return Math.round((lastHourSavings * 0.85 + (transition.savings || 0)) * 100) / 100;
            }
            return Math.round(newTotal * 100) / 100;
          });
          processedTransitionsRef.current.add(transitionKey);
          setShouldPulse(true);
          setTimeout(() => setShouldPulse(false), 600);
          setTransitionCount((prev) => prev + 1);
        }
        
        addTransition(transition.from, transition.to, duration, transition.savings);

        const reasonCard: TransitionWithReasons = {
          from: transition.from,
          to: transition.to,
          savings: transition.savings || 0,
          financial_gains: (transition as any).financial_gains || [],
          total_gain_eur: (transition as any).total_gain_eur || transition.savings || 0,
          summary: (transition as any).summary || "",
          id: transitionKey,
          expiresAt: Date.now() + 4000,
        };

        setLiveReasons((prev) => {
          const next = [...prev, reasonCard];
          return next.slice(-3);
        });

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
        {/* Transition Panel + Map + Live Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-3 items-stretch">
            {/* ── LEFT: TRANSITION PANEL ──────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="hidden lg:block"
            >
              <Card className="h-full overflow-hidden">
                <TransitionPanel
                  totalSavings={totalSavings}
                  shouldPulse={shouldPulse}
                  transitionCount={transitionCount}
                  activeCount={activeTransitions.length}
                  liveReasons={liveReasons}
                />
              </Card>
            </motion.div>

            {/* ── CENTER: MAP CARD ────────────────────────────── */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Server Map</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-500 opacity-60" />
                      Inactive
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      Active transition
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
                <div className="rounded-lg border border-border bg-[#f5f8fa] overflow-hidden relative">
                  <WorldMap 
                    serveurs={allServeurs} 
                    allServeursColor={true}
                    activeTransitions={activeTransitions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── RIGHT: LIVE DATA FEED ──────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="hidden lg:block"
            >
              <Card className="h-full overflow-hidden">
                <LiveDataFeed />
              </Card>
            </motion.div>
          </div>
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
                Server List
              </CardTitle>
              <CardDescription>All network infrastructure points</CardDescription>
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
                        className={dc.status === "online" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : ""}
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
