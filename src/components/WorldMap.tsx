import { memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import type { ActiveTransition } from "@/data/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface Serveur {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  status?: "online" | "maintenance" | "offline";
}

export interface Connection {
  from: [number, number];
  to: [number, number];
}

interface WorldMapProps {
  serveurs?: Serveur[];
  connections?: Connection[];
  className?: string;
  allServeursColor?: boolean; // true = utiliser un bleu différent pour "tous les serveurs"
  activeTransitions?: ActiveTransition[]; // transitions actives
}

const defaultServeurs: Serveur[] = [
  { name: "DC Paris", coordinates: [2.35, 48.85], status: "online" },
  { name: "DC New York", coordinates: [-74.01, 40.71], status: "online" },
  { name: "DC Tokyo", coordinates: [139.65, 35.68], status: "online" },
  { name: "DC London", coordinates: [-0.13, 51.51], status: "online" },
  { name: "DC Frankfurt", coordinates: [8.68, 50.11], status: "online" },
  { name: "DC Singapore", coordinates: [103.85, 1.29], status: "online" },
  { name: "DC São Paulo", coordinates: [-46.63, -23.55], status: "online" },
  { name: "DC Sydney", coordinates: [151.21, -33.87], status: "online" },
  { name: "DC Mumbai", coordinates: [72.88, 19.08], status: "online" },
  { name: "DC Toronto", coordinates: [-79.38, 43.65], status: "maintenance" },
  { name: "DC Dubai", coordinates: [55.27, 25.20], status: "online" },
  { name: "DC Seoul", coordinates: [126.98, 37.57], status: "online" },
];

const defaultConnections: Connection[] = [
  { from: [2.35, 48.85], to: [-74.01, 40.71] },
  { from: [2.35, 48.85], to: [-0.13, 51.51] },
  { from: [2.35, 48.85], to: [8.68, 50.11] },
  { from: [-74.01, 40.71], to: [-0.13, 51.51] },
  { from: [-0.13, 51.51], to: [139.65, 35.68] },
  { from: [8.68, 50.11], to: [139.65, 35.68] },
  { from: [139.65, 35.68], to: [103.85, 1.29] },
  { from: [103.85, 1.29], to: [72.88, 19.08] },
  { from: [-74.01, 40.71], to: [-79.38, 43.65] },
  { from: [-46.63, -23.55], to: [-74.01, 40.71] },
  { from: [151.21, -33.87], to: [139.65, 35.68] },
  { from: [55.27, 25.20], to: [72.88, 19.08] },
  { from: [55.27, 25.20], to: [8.68, 50.11] },
  { from: [126.98, 37.57], to: [139.65, 35.68] },
];

const WorldMap = memo(({
  serveurs = defaultServeurs,
  connections = defaultConnections,
  className = "",
  allServeursColor = false,
  activeTransitions = [],
}: WorldMapProps) => {
  // Fonction pour vérifier si un serveur est actif
  const isServerActive = useMemo(() => {
    const activeSet = new Set<string>();
    activeTransitions.forEach((t) => {
      activeSet.add(t.from);
      activeSet.add(t.to);
    });
    return (serverName: string) => activeSet.has(serverName);
  }, [activeTransitions]);

  // Trouver les coordonnées d'un serveur par son nom
  const getServerCoordinates = useMemo(() => {
    const coordMap = new Map<string, [number, number]>();
    serveurs.forEach((s) => {
      coordMap.set(s.name, s.coordinates);
    });
    return (serverName: string): [number, number] | null => {
      return coordMap.get(serverName) || null;
    };
  }, [serveurs]);

  // Calculer les positions des labels pour éviter les superpositions
  const labelPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const activeSet = new Set<string>();
    activeTransitions.forEach((t) => {
      activeSet.add(t.from);
      activeSet.add(t.to);
    });
    const activeServers = serveurs.filter((s) => activeSet.has(s.name));
    
    // Distance minimale pour considérer deux serveurs comme proches (en degrés)
    const PROXIMITY_THRESHOLD = 8;
    
    activeServers.forEach((server, index) => {
      let offsetX = 0;
      let offsetY = -14; // Position par défaut au-dessus
      
      // Vérifier les serveurs proches
      activeServers.forEach((otherServer, otherIndex) => {
        if (index === otherIndex) return;
        
        const [lon1, lat1] = server.coordinates;
        const [lon2, lat2] = otherServer.coordinates;
        
        // Calcul de distance approximative (formule de Haversine simplifiée)
        const latDiff = Math.abs(lat1 - lat2);
        const lonDiff = Math.abs(lon1 - lon2);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        if (distance < PROXIMITY_THRESHOLD) {
          // Si les serveurs sont proches, décaler les labels
          // Alterner entre haut/bas et gauche/droite selon l'index
          if (index < otherIndex) {
            // Premier serveur : décaler vers le haut-gauche
            offsetY = -18;
            offsetX = -15;
          } else {
            // Deuxième serveur : décaler vers le bas-droite
            offsetY = -10;
            offsetX = 15;
          }
          
          // Si très proches, utiliser un décalage vertical plus important
          if (distance < PROXIMITY_THRESHOLD / 2) {
            if (index < otherIndex) {
              offsetY = -22;
              offsetX = -20;
            } else {
              offsetY = -6;
              offsetX = 20;
            }
          }
        }
      });
      
      positions.set(server.name, { x: offsetX, y: offsetY });
    });
    
    return positions;
  }, [serveurs, activeTransitions]);

  // Calculer les positions des labels de prix pour éviter les chevauchements
  const priceLabelPositions = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>();
    
    // Distance minimale pour considérer deux transitions comme proches (en degrés)
    const PROXIMITY_THRESHOLD = 5;
    
    activeTransitions.forEach((transition, index) => {
      const fromCoords = getServerCoordinates(transition.from);
      const toCoords = getServerCoordinates(transition.to);
      
      if (!fromCoords || !toCoords) return;
      
      const midLon = (fromCoords[0] + toCoords[0]) / 2;
      const midLat = (fromCoords[1] + toCoords[1]) / 2;
      
      let offsetX = 0;
      let offsetY = -12; // Position par défaut au-dessus
      
      // Vérifier les autres transitions proches
      activeTransitions.forEach((otherTransition, otherIndex) => {
        if (index === otherIndex) return;
        
        const otherFromCoords = getServerCoordinates(otherTransition.from);
        const otherToCoords = getServerCoordinates(otherTransition.to);
        
        if (!otherFromCoords || !otherToCoords) return;
        
        const otherMidLon = (otherFromCoords[0] + otherToCoords[0]) / 2;
        const otherMidLat = (otherFromCoords[1] + otherToCoords[1]) / 2;
        
        // Calcul de distance entre les points milieux
        const latDiff = Math.abs(midLat - otherMidLat);
        const lonDiff = Math.abs(midLon - otherMidLon);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        if (distance < PROXIMITY_THRESHOLD) {
          // Si les transitions sont proches, décaler les labels
          // Alterner selon l'index pour éviter les chevauchements
          if (index < otherIndex) {
            // Première transition : décaler vers le haut-gauche
            offsetY = -16;
            offsetX = -12;
          } else {
            // Deuxième transition : décaler vers le bas-droite
            offsetY = -8;
            offsetX = 12;
          }
          
          // Si très proches, utiliser un décalage plus important
          if (distance < PROXIMITY_THRESHOLD / 2) {
            if (index < otherIndex) {
              offsetY = -20;
              offsetX = -18;
            } else {
              offsetY = -4;
              offsetX = 18;
            }
          }
        }
      });
      
      positions.set(transition.timestamp, { x: offsetX, y: offsetY });
    });
    
    return positions;
  }, [activeTransitions, getServerCoordinates]);
  return (
    <div className={`w-full relative ${className}`} style={{ overflow: "hidden", marginBottom: "-10%" }}>
      <div style={{ clipPath: "inset(0 0 3% 0)" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
            center: [10, 28], // Centré plus au nord pour exclure l'Antarctique et réduire l'espace en bas
          }}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
        {/* Geographies – black & white style */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => {
                // Exclure l'Antarctique (identifié par différents noms selon le dataset)
                const name = geo.properties?.NAME || geo.properties?.name || geo.properties?.NAME_LONG || "";
                const iso = geo.properties?.ISO_A2 || geo.properties?.iso_a2 || "";
                return (
                  !name.toLowerCase().includes("antarctica") &&
                  !name.toLowerCase().includes("antarctique") &&
                  iso !== "AQ" &&
                  iso !== "TF" // Terres australes françaises
                );
              })
              .map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1a2e"
                  stroke="#2a2a40"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#22223b" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
          }
        </Geographies>

        {/* Lignes de transition actives (VERTES) - sans les labels de prix */}
        {activeTransitions.map((transition, i) => {
          const fromCoords = getServerCoordinates(transition.from);
          const toCoords = getServerCoordinates(transition.to);

          if (!fromCoords || !toCoords) return null;

          return (
            <Line
              key={`transition-line-${i}-${transition.timestamp}`}
              from={fromCoords}
              to={toCoords}
              stroke="#22c55e"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="5,5"
              style={{
                animation: "dash 1s linear infinite",
                filter: "drop-shadow(0 0 4px rgba(34, 197, 94, 0.6))",
              }}
            />
          );
        })}


        {/* Serveur markers */}
        {serveurs.map((dc) => {
          const isActive = isServerActive(dc.name);
          const baseSize = allServeursColor ? 3 : 4;
          const activeSize = 6;
          const baseGlowSize = allServeursColor ? 5 : 8;
          const activeGlowSize = 12;

          return (
            <Marker key={dc.name} coordinates={dc.coordinates}>
              {/* Outer glow */}
              <circle
                r={isActive ? activeGlowSize : baseGlowSize}
                fill={
                  isActive
                    ? "rgba(34, 197, 94, 0.2)"
                    : allServeursColor
                    ? "rgba(96, 165, 250, 0.15)"
                    : "rgba(59, 130, 246, 0.15)"
                }
                className={isActive ? "animate-pulse" : ""}
                style={{
                  transition: "r 0.3s ease, fill 0.3s ease",
                }}
              />
              {/* Inner dot */}
              <circle
                r={isActive ? activeSize : baseSize}
                fill={
                  isActive
                    ? "#22c55e"
                    : dc.status === "maintenance"
                    ? "#f59e0b"
                    : dc.status === "offline"
                    ? "#ef4444"
                    : "#6b7280"
                }
                stroke={isActive ? "#16a34a" : "#0f172a"}
                strokeWidth={isActive ? 1.5 : 1}
                opacity={isActive ? 1 : 0.6}
                style={{
                  transition: "r 0.3s ease, fill 0.3s ease, opacity 0.3s ease",
                }}
              />
              {/* Label - toujours afficher pour les serveurs actifs, sinon seulement si pas en mode "tous les serveurs" */}
              {(isActive || !allServeursColor) && (
                <text
                  textAnchor={isActive && labelPositions.get(dc.name)?.x !== 0 ? "start" : "middle"}
                  x={isActive ? labelPositions.get(dc.name)?.x || 0 : 0}
                  y={isActive ? labelPositions.get(dc.name)?.y || -14 : -14}
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: isActive ? 7 : 8,
                    fill: isActive ? "#22c55e" : "#94a3b8",
                    opacity: isActive ? 1 : 0.7,
                    fontWeight: isActive ? "600" : "400",
                    filter: isActive ? "drop-shadow(0 0 2px rgba(34, 197, 94, 0.5))" : "none",
                  }}
                >
                  {dc.name}
                </text>
              )}
            </Marker>
          );
        })}

        {/* Labels de prix des transitions - rendus en dernier pour être au-dessus de tout */}
        {activeTransitions.map((transition, i) => {
          const fromCoords = getServerCoordinates(transition.from);
          const toCoords = getServerCoordinates(transition.to);

          if (!fromCoords || !toCoords) return null;

          // Calculer le point milieu pour positionner le prix
          const midLon = (fromCoords[0] + toCoords[0]) / 2;
          const midLat = (fromCoords[1] + toCoords[1]) / 2;
          const savings = transition.savings || 0;
          
          // Obtenir la position du label de prix (avec décalage pour éviter chevauchements)
          const pricePos = priceLabelPositions.get(transition.timestamp) || { x: 0, y: -12 };

          return (
            <Marker key={`transition-price-${i}-${transition.timestamp}`} coordinates={[midLon, midLat]}>
              <rect
                x={pricePos.x - 18}
                y={pricePos.y - 6}
                width={36}
                height={12}
                rx={3}
                fill="rgba(15, 23, 42, 0.85)"
                stroke="#22c55e"
                strokeWidth={0.8}
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
                }}
              />
              <text
                textAnchor="middle"
                x={pricePos.x}
                y={pricePos.y + 2}
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 7,
                  fill: "#22c55e",
                  fontWeight: "600",
                }}
              >
                +{savings.toFixed(2)}€
              </text>
            </Marker>
          );
        })}
        </ComposableMap>
      </div>
      {/* CSS pour l'animation du trait vert */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </div>
  );
});

WorldMap.displayName = "WorldMap";

export default WorldMap;
