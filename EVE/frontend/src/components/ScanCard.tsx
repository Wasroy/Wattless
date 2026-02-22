import { motion } from "framer-motion";
import { Cpu, Leaf, Zap, Thermometer } from "lucide-react";

interface ScanResult {
  gpu_name: string;
  region: string;
  spot_price_usd_hr: number;
  ondemand_price_usd_hr: number;
  savings_pct: number;
  carbon_intensity_gco2_kwh: number;
  carbon_index: string;
  temperature_c: number;
  wind_kmh: number;
  nerve_score: number;
  total_cost_estimate_usd: number;
  total_co2_grams: number;
}

interface ScanCardProps {
  result: ScanResult;
  loading?: boolean;
  onDeploy?: () => void;
}

const ScanCard = ({ result, loading, onDeploy }: ScanCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-xl overflow-hidden border-l-4 border-l-primary shadow-sm animate-glow-ambient"
  >
    <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
      <Cpu className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-foreground">NERVE GPU Scan</span>
      <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
        3 regions scanned
      </span>
    </div>

    {loading ? (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Scanning 3 Azure regions...
        </div>
      </div>
    ) : (
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xl font-bold text-foreground">{result.gpu_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{result.region}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Spot price</p>
            <p className="text-2xl font-bold text-primary">${result.spot_price_usd_hr}/h</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              vs <span className="line-through">${result.ondemand_price_usd_hr}/h</span> on-demand
              <span className="text-green-600 font-semibold ml-1">-{result.savings_pct}%</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <Zap className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{result.nerve_score.toFixed(3)}</p>
            <p className="text-[10px] text-muted-foreground">NERVE score</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <Leaf className="w-3.5 h-3.5 text-green-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{result.carbon_intensity_gco2_kwh}g</p>
            <p className="text-[10px] text-muted-foreground">CO₂/kWh</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <Thermometer className="w-3.5 h-3.5 text-sky-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-foreground">{result.temperature_c}°C</p>
            <p className="text-[10px] text-muted-foreground">Temp</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <span className="text-[10px] block mb-1">💨</span>
            <p className="text-xs font-bold text-foreground">{result.wind_kmh} km/h</p>
            <p className="text-[10px] text-muted-foreground">Wind</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2 mb-4 border border-primary/20 shadow-[0_0_12px_rgba(234,179,8,0.08)]">
          <span className="text-xs text-muted-foreground">Estimated cost (~10 min training)</span>
          <span className="text-sm font-bold text-primary">${result.total_cost_estimate_usd}</span>
        </div>

        {onDeploy && (
          <button
            onClick={onDeploy}
            className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg btn-glow"
          >
            Deploy to this GPU →
          </button>
        )}
      </div>
    )}
  </motion.div>
);

export default ScanCard;
