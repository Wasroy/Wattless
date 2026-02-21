import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorldMap from "@/components/WorldMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Import des données depuis les fichiers JSON
import serveursData from "@/data/serveurs.json";
import allServeursData from "@/data/all_servers.json";
import type { Serveur } from "@/data/types";

// Données par défaut en cas d'erreur de chargement du JSON
const defaultServeurs: Serveur[] = [
  { name: "DC Paris", coordinates: [2.35, 48.85] as [number, number], status: "online" as const, region: "Europe", latency: "12ms" },
  { name: "DC New York", coordinates: [-74.01, 40.71] as [number, number], status: "online" as const, region: "Amérique du Nord", latency: "45ms" },
  { name: "DC Tokyo", coordinates: [139.65, 35.68] as [number, number], status: "online" as const, region: "Asie-Pacifique", latency: "120ms" },
  { name: "DC London", coordinates: [-0.13, 51.51] as [number, number], status: "online" as const, region: "Europe", latency: "18ms" },
  { name: "DC Frankfurt", coordinates: [8.68, 50.11] as [number, number], status: "online" as const, region: "Europe", latency: "15ms" },
  { name: "DC Singapore", coordinates: [103.85, 1.29] as [number, number], status: "online" as const, region: "Asie-Pacifique", latency: "95ms" },
  { name: "DC São Paulo", coordinates: [-46.63, -23.55] as [number, number], status: "online" as const, region: "Amérique du Sud", latency: "180ms" },
  { name: "DC Sydney", coordinates: [151.21, -33.87] as [number, number], status: "online" as const, region: "Océanie", latency: "150ms" },
  { name: "DC Mumbai", coordinates: [72.88, 19.08] as [number, number], status: "online" as const, region: "Asie du Sud", latency: "85ms" },
  { name: "DC Toronto", coordinates: [-79.38, 43.65] as [number, number], status: "maintenance" as const, region: "Amérique du Nord", latency: "52ms" },
  { name: "DC Dubai", coordinates: [55.27, 25.20] as [number, number], status: "online" as const, region: "Moyen-Orient", latency: "75ms" },
  { name: "DC Seoul", coordinates: [126.98, 37.57] as [number, number], status: "online" as const, region: "Asie-Pacifique", latency: "110ms" },
];

// Utiliser les données du JSON si disponibles, sinon utiliser les données par défaut
// Conversion des coordonnées en tuple et des statuts en const assertions
const isUsingJsonData = serveursData && Array.isArray(serveursData) && serveursData.length > 0;

// Log pour vérifier quelle source de données est utilisée (peut être retiré en production)
if (process.env.NODE_ENV === "development") {
  console.log(
    `[Mapmonde] ${isUsingJsonData ? "✅ Utilisation des données JSON" : "⚠️ Utilisation des données par défaut"}`,
    isUsingJsonData ? `(${serveursData.length} serveurs)` : ""
  );
}

const serveurs: Serveur[] = (isUsingJsonData ? serveursData : defaultServeurs).map((dc) => ({
  ...dc,
  coordinates: dc.coordinates as [number, number],
  status: dc.status as "online" | "maintenance" | "offline",
}));

// Préparer la liste complète de tous les serveurs
const allServeurs: Serveur[] = allServeursData.map((s) => ({
  ...s,
  coordinates: s.coordinates as [number, number],
  status: s.status as "online" | "maintenance" | "offline",
}));

const Mapmonde = () => {
  const [showAllServers, setShowAllServers] = useState(false);

  const activeServeurs = showAllServers ? allServeurs : serveurs;

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
                <div className="flex items-center gap-4">
                  <CardTitle>Carte des serveurs</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-all"
                      checked={showAllServers}
                      onCheckedChange={setShowAllServers}
                    />
                    <label
                      htmlFor="show-all"
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      Tous les serveurs ({allServeurs.length})
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Online
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
              <div className="rounded-lg border border-border bg-[#0d0d1a] overflow-hidden">
                <WorldMap serveurs={activeServeurs} allServeursColor={showAllServers} />
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
                {activeServeurs.map((dc) => (
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
