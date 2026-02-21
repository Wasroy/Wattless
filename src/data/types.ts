export interface DataCenter {
  name: string;
  coordinates: [number, number];
  status: "online" | "maintenance" | "offline";
  region: string;
  latency: string;
}
