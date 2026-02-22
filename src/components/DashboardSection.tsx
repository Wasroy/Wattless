import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RegionSummary {
  region_id: string;
  region_name: string;
  location: string;
  carbon_gco2_kwh: number;
  carbon_index: string;
  cheapest_gpu_name: string;
  cheapest_spot_price: number;
  cheapest_ondemand_price: number;
  cheapest_savings_pct: number;
}

const mockRegions: RegionSummary[] = [
  {
    region_id: "uksouth", region_name: "UK South", location: "London, UK",
    carbon_gco2_kwh: 45, carbon_index: "very low",
    cheapest_gpu_name: "A100 80GB",
    cheapest_spot_price: 0.31, cheapest_ondemand_price: 3.67, cheapest_savings_pct: 91.6,
  },
  {
    region_id: "northeurope", region_name: "North Europe", location: "Dublin, Ireland",
    carbon_gco2_kwh: 38, carbon_index: "very low",
    cheapest_gpu_name: "A100 80GB",
    cheapest_spot_price: 0.35, cheapest_ondemand_price: 3.67, cheapest_savings_pct: 90.5,
  },
  {
    region_id: "westeurope", region_name: "West Europe", location: "Amsterdam, NL",
    carbon_gco2_kwh: 95, carbon_index: "low",
    cheapest_gpu_name: "V100 16GB",
    cheapest_spot_price: 0.12, cheapest_ondemand_price: 1.02, cheapest_savings_pct: 88.2,
  },
];

const DashboardSection = () => {
  const [regions] = useState<RegionSummary[]>(mockRegions);

  const cheapestIdx = regions.length > 0
    ? regions.reduce((best, r, i) => r.cheapest_spot_price < regions[best].cheapest_spot_price ? i : best, 0)
    : -1;

  return (
    <section className="py-24 bg-zinc-50">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-600 tracking-widest uppercase">
              Live data
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Prices right now
          </h2>
          <p className="text-zinc-400 text-sm">
            This is what NERVE sees. Updated every 60 seconds across 12 regions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-8">
          {regions.map((r, i) => (
            <motion.div
              key={r.region_id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`bg-white rounded-2xl p-5 border transition-colors ${
                i === cheapestIdx ? "border-emerald-200 ring-1 ring-emerald-100" : "border-zinc-100"
              }`}
            >
              {i === cheapestIdx && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-1 rounded-full mb-3">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Best pick
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{r.location}</p>
              <p className="font-mono text-[10px] text-zinc-400 mb-4">{r.region_id}</p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Spot</span>
                  <span className="font-mono font-semibold text-foreground">${r.cheapest_spot_price.toFixed(3)}/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Save</span>
                  <span className="text-emerald-600 font-semibold">-{r.cheapest_savings_pct.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">CO&#8322;</span>
                  <span className={`font-mono ${
                    r.carbon_gco2_kwh < 100 ? "text-emerald-600" :
                    r.carbon_gco2_kwh < 250 ? "text-amber-500" : "text-red-500"
                  }`}>
                    {r.carbon_gco2_kwh.toFixed(0)}g/kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">GPU</span>
                  <span className="text-zinc-500">{r.cheapest_gpu_name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/mapmonde" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors inline-flex items-center gap-1.5">
            View full map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
