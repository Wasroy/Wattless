export interface Serveur {
  name: string;
  coordinates: [number, number];
  status: "online" | "maintenance" | "offline";
  region: string;
  latency: string;
}
