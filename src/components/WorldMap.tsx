import { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface DataCenter {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  status?: "online" | "maintenance" | "offline";
}

export interface Connection {
  from: [number, number];
  to: [number, number];
}

interface WorldMapProps {
  datacenters?: DataCenter[];
  connections?: Connection[];
  className?: string;
}

const defaultDatacenters: DataCenter[] = [
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
  datacenters = defaultDatacenters,
  connections = defaultConnections,
  className = "",
}: WorldMapProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 110,
          center: [10, 20],
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Geographies – black & white style */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
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

        {/* Connection lines */}
        {connections.map((conn, i) => (
          <Line
            key={`conn-${i}`}
            from={conn.from}
            to={conn.to}
            stroke="rgba(59, 130, 246, 0.25)"
            strokeWidth={1}
            strokeLinecap="round"
          />
        ))}

        {/* Datacenter markers */}
        {datacenters.map((dc) => (
          <Marker key={dc.name} coordinates={dc.coordinates}>
            {/* Outer glow */}
            <circle
              r={8}
              fill="rgba(59, 130, 246, 0.15)"
              className="animate-pulse"
            />
            {/* Inner dot */}
            <circle
              r={4}
              fill={
                dc.status === "maintenance"
                  ? "#f59e0b"
                  : dc.status === "offline"
                  ? "#ef4444"
                  : "#3b82f6"
              }
              stroke="#0f172a"
              strokeWidth={1}
            />
            {/* Label */}
            <text
              textAnchor="middle"
              y={-14}
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 8,
                fill: "#94a3b8",
              }}
            >
              {dc.name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
});

WorldMap.displayName = "WorldMap";

export default WorldMap;
