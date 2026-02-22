export interface Serveur {
  name: string;
  coordinates: [number, number];
  status: "online" | "maintenance" | "offline";
  region: string;
  latency: string;
}

export interface ActiveTransition {
  from: string; // nom du serveur source
  to: string; // nom du serveur destination
  timestamp: number; // timestamp de début
  duration: number; // durée en ms (2000ms = 2 secondes)
  savings?: number; // économies en euros (ex: 0.75)
}
