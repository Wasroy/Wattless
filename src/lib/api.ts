/**
 * NERVE API Client — connects to live backend on :8000
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

// ── Types ───────────────────────────────────────────────────────────

export interface GpuInstance {
  sku: string;
  gpu_name: string;
  gpu_count: number;
  vcpus: number;
  ram_gb: number;
  spot_price_usd_hr: number;
  ondemand_price_usd_hr: number;
  savings_pct: number;
  availability: string;
}

export interface AZInfo {
  az_id: string;
  az_name: string;
  gpu_instances: GpuInstance[];
  carbon_intensity_gco2_kwh: number;
  carbon_index: string;
  temperature_c: number;
  wind_kmh: number;
  score: number | null;
}

export interface RegionInfo {
  region_id: string;
  region_name: string;
  cloud_provider: string;
  location: string;
  availability_zones: AZInfo[];
}

export interface RegionSummary {
  region_id: string;
  region_name: string;
  location: string;
  carbon_gco2_kwh: number;
  carbon_index: string;
  carbon_source: string;
  temperature_c: number;
  wind_kmh: number;
  gpu_count: number;
  cheapest_gpu_name: string;
  cheapest_spot_price: number;
  cheapest_ondemand_price: number;
  cheapest_savings_pct: number;
  cheapest_sku: string;
}

export interface DashboardStats {
  total_jobs_managed: number;
  total_savings_usd: number;
  total_savings_eur: number;
  total_co2_saved_grams: number;
  total_checkpoints_saved: number;
  total_evictions_handled: number;
  avg_savings_pct: number;
  uptime_pct: number;
  regions_monitored: string[];
}

export interface PriceCurvePoint {
  hour: number;
  label: string;
  spot_price: number;
  ondemand_price: number;
  is_current: boolean;
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

export interface CheckpointEvent {
  job_id: string;
  trigger: string;
  from_az: string;
  to_az: string;
  checkpoint_size_gb: number;
  timeline: Array<{
    t_sec: number;
    event: string;
    detail: string;
  }>;
  total_duration_sec: number;
  data_loss: string;
}

export interface TimeShiftPlan {
  job_type: string;
  gpu_hours: number;
  deadline: string;
  recommended_start: string;
  recommended_region: string;
  price_now: number;
  price_optimal: number;
  price_reduction_pct: number;
  carbon_now: number;
  carbon_optimal: number;
  carbon_reduction_pct: number;
  reason: string;
}

// ── API calls ───────────────────────────────────────────────────────

export const api = {
  health: () => request<{ status: string; scraper: unknown }>("/health"),

  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  regionsSummary: () => request<RegionSummary[]>("/api/regions/summary"),

  getRegion: (id: string) => request<RegionInfo>(`/api/region?region_id=${id}`),

  getAZs: (id: string) => request<AZInfo[]>(`/api/azs?region_id=${id}`),

  priceCurve: (regionId: string) =>
    request<PriceCurvePoint[]>(`/api/prices/curve?region_id=${regionId}`),

  simulate: (body: SimulateRequest) =>
    request<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  checkpointSimulate: (body: {
    job_id?: string;
    current_az?: string;
    model_size_gb?: number;
    progress_pct?: number;
  }) =>
    request<CheckpointEvent>("/api/checkpoint/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  timeshiftPlan: (body: {
    job_type?: string;
    gpu_hours?: number;
    deadline_hours?: number;
    preferred_region?: string;
  }) =>
    request<TimeShiftPlan>("/api/timeshifting/plan", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
