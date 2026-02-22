/**
 * NERVE API Client — connects to live backend
 */

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export interface SimulateRequest {
  model_name?: string;
  gpu_hours?: number;
  min_gpu_memory_gb?: number;
  deadline_hours?: number;
}

export interface SimulateResponse {
  decision: {
    region: string;
    az: string;
    gpu_sku: string;
    gpu_name: string;
    strategy: string;
    estimated_spot_price: number;
    reason: string;
  };
  fallback_gpu: {
    sku: string;
    gpu_name: string;
    spot_price: number;
    reason: string;
  };
  checkpointing: {
    interval_min: number;
    estimated_size_gb: number;
    storage: string;
  };
  savings: {
    spot_total_usd: number;
    ondemand_total_usd: number;
    saved_usd: number;
    saved_eur: number;
    savings_pct: number;
  };
  green_impact: {
    total_kwh: number;
    total_co2_kg: number;
    co2_vs_worst_region_kg: number;
    equivalent: string;
  };
  server_path: Array<{
    step: number;
    action: string;
    detail: string;
  }>;
  risk_assessment: {
    interruption_probability: string;
    risk_level: string;
    mitigation: string;
  };
}

export const api = {
  simulate: (body: SimulateRequest) =>
    request<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
