import { motion } from "framer-motion";
import { Globe, Server, Wifi, Activity, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorldMap from "@/components/WorldMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import des données depuis le fichier JSON
import datacentersData from "@/data/datacenters.json";
import type { DataCenter } from "@/data/types";

// Données par défaut en cas d'erreur de chargement du JSON
const defaultDatacenters: DataCenter[] = [
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
const isUsingJsonData = datacentersData && Array.isArray(datacentersData) && datacentersData.length > 0;

// Log pour vérifier quelle source de données est utilisée (peut être retiré en production)
if (process.env.NODE_ENV === "development") {
  console.log(
    `[Mapmonde] ${isUsingJsonData ? "✅ Utilisation des données JSON" : "⚠️ Utilisation des données par défaut"}`,
    isUsingJsonData ? `(${datacentersData.length} datacenters)` : ""
  );
}

const datacenters: DataCenter[] = (isUsingJsonData ? datacentersData : defaultDatacenters).map((dc) => ({
  ...dc,
  coordinates: dc.coordinates as [number, number],
  status: dc.status as "online" | "maintenance" | "offline",
}));

const networkStats = [
  { label: "Datacenters actifs", value: "11", icon: Server },
  { label: "En maintenance", value: "1", icon: Activity },
  { label: "Latence moyenne", value: "80ms", icon: Wifi },
  { label: "Régions couvertes", value: "7", icon: Globe },
];

const Mapmonde = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-20 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Réseau Global</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Infrastructure mondiale — datacenters et connexions en temps réel
          </p>
        </motion.div>

        {/* Network Stats */}
        <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 mb-3">
          {networkStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-2 p-2.5">
                  <stat.icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* World Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-3"
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Carte des datacenters</CardTitle>
                  <CardDescription className="text-[10px]">Points d'infrastructure et connexions réseau</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Online
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Maint.
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Offline
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="rounded-lg border border-border bg-[#0d0d1a] overflow-hidden h-[280px]">
                <WorldMap datacenters={datacenters} className="h-full" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Datacenter List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="flex items-center gap-1.5 text-base">
                <MapPin className="h-4 w-4" />
                Liste des datacenters
              </CardTitle>
              <CardDescription className="text-[10px]">Tous les points d'infrastructure du réseau</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4 max-h-[200px] overflow-y-auto">
                {datacenters.map((dc) => (
                  <div
                    key={dc.name}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          dc.status === "online"
                            ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                            : dc.status === "maintenance"
                            ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                            : "bg-red-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{dc.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{dc.region}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{dc.latency}</span>
                      <Badge
                        variant={dc.status === "online" ? "default" : "secondary"}
                        className={`text-[9px] px-1.5 py-0 ${
                          dc.status === "online" ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" : ""
                        }`}
                      >
                        {dc.status === "online" ? "On" : dc.status === "maintenance" ? "Maint" : "Off"}
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
