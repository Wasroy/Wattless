import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TrendingUp } from "lucide-react";
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
  const [totalSavings, setTotalSavings] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);
  const processedTransitionsRef = useRef<Set<string>>(new Set());

  // Note: Le total est maintenant calculé directement lors du déclenchement de la transition
  // dans le useEffect ci-dessous, pour éviter de manquer des transitions qui se terminent rapidement

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
          // Ajouter immédiatement au total (avant même que la transition soit active)
          setTotalSavings((prev) => prev + (transition.savings || 0));
          processedTransitionsRef.current.add(transitionKey);
          setShouldPulse(true);
          setTimeout(() => setShouldPulse(false), 600);
        }
        
        addTransition(transition.from, transition.to, duration, transition.savings);
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
                {/* Badge total économies en haut à gauche */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute top-4 left-4 z-10"
                >
                  <motion.div
                    className="bg-background/95 backdrop-blur-sm border border-green-500/30 rounded-lg px-4 py-2.5 shadow-lg"
                    animate={{
                      scale: shouldPulse ? [1, 1.05, 1] : 1,
                      boxShadow: shouldPulse
                        ? [
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            "0 4px 12px -1px rgba(34, 197, 94, 0.5)",
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          ]
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Total savings</span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={totalSavings.toFixed(2)}
                            initial={{ scale: 1.2, opacity: 0, y: -10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="text-lg font-bold font-mono text-green-500"
                          >
                            {totalSavings.toFixed(2)}€
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
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
                Server List
              </CardTitle>
              <CardDescription>All infrastructure endpoints in the NERVE network</CardDescription>
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
