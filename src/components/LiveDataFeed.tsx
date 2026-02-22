import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Wind, Leaf, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import liveFeedData from "@/data/live_scrape_feed.json";

const API_NAMES = [
  "Azure Retail Prices API",
  "Open-Meteo Weather API",
  "Carbon Intensity UK API",
  "RTE eCO2mix",
  "Supabase Edge Functions",
];

const LiveDataFeed = () => {
  const [feedItems, setFeedItems] = useState<Array<{ data: (typeof liveFeedData)[0]; id: string }>>([]);
  const [currentApi, setCurrentApi] = useState(API_NAMES[0]);
  const [progress, setProgress] = useState(0);
  const feedIndexRef = useRef(0);

  useEffect(() => {
    const preFill = liveFeedData.slice(0, 9).map((d, i) => ({
      data: d,
      id: `pre-${i}`,
    }));
    setFeedItems(preFill);
    feedIndexRef.current = 9;

    const interval = setInterval(() => {
      const idx = feedIndexRef.current % liveFeedData.length;
      const item = liveFeedData[idx];
      feedIndexRef.current++;

      setFeedItems((prev) => {
        const next = [{ data: item, id: `feed-${Date.now()}-${idx}` }, ...prev];
        // Garder seulement les 9 plus récents
        return next.slice(0, 9);
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Animation de la barre de scraping
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Changer d'API aléatoirement quand la barre est complète
          setCurrentApi(API_NAMES[Math.floor(Math.random() * API_NAMES.length)]);
          return 0;
        }
        return prev + 0.4; // Augmenter de 0.4% à chaque intervalle (plus réaliste)
      });
    }, 120); // Mise à jour toutes les 120ms (~25 secondes pour compléter)

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2 shrink-0">
        <motion.div
          className="h-2 w-2 rounded-full bg-green-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">
          Live Data Feed
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              type="button"
              className="ml-auto h-5 w-5 rounded-full bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
              aria-label="Backend information"
            >
              <Info className="h-3 w-3 text-zinc-600" />
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            sideOffset={10}
            className="max-w-xs p-4 z-[10000] bg-white border-zinc-200 shadow-lg"
          >
            <div className="space-y-2">
              <p className="font-semibold text-sm text-zinc-900">Running on Supabase</p>
              <p className="text-xs text-zinc-600">
                Backend APIs integrated:
              </p>
              <ul className="text-xs text-zinc-600 space-y-1 list-disc list-inside">
                <li>Azure Retail Prices API</li>
                <li>Open-Meteo Weather API</li>
                <li>Carbon Intensity UK API</li>
                <li>RTE eCO2mix (France)</li>
                <li>Supabase Edge Functions</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Scraping bar */}
      <div className="px-3 py-2 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-medium text-zinc-600">
            Scrapping...
          </span>
          <span className="text-[9px] font-mono text-emerald-600 truncate flex-1">
            {currentApi}
          </span>
        </div>
        <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>

      {/* Feed items — fixed, no scroll, overflow clipped */}
      <div className="flex-1 overflow-hidden relative">
        {/* Fade bottom to hint there are more items */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

        <div className="flex flex-col gap-1 px-2 pt-2 pb-2 h-full justify-start">
          <AnimatePresence initial={false} mode="popLayout">
            {feedItems.map((item) => {
              const d = item.data;
              const isGpu = d.type === "gpu_price";
              const isWeather = d.type === "weather";
              const isCarbon = d.type === "carbon";

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -18, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-50/80 border border-zinc-100 rounded-lg px-3 py-2 flex flex-col gap-1 shrink-0 min-h-[60px]"
                >
                  {/* Row 1: icon + type badge + region */}
                  <div className="flex items-center gap-1.5">
                    {isGpu && <Cpu className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                    {isWeather && <Wind className="h-3 w-3 text-cyan-500 flex-shrink-0" />}
                    {isCarbon && <Leaf className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isGpu ? "text-blue-500" : isWeather ? "text-cyan-500" : "text-emerald-500"
                      }`}
                    >
                      {isGpu ? "GPU" : isWeather ? "METEO" : "CO₂"}
                    </span>
                    <span className="text-[9px] text-zinc-400 ml-auto truncate">
                      {(d as any).city || d.region}
                    </span>
                  </div>

                  {/* Row 2: data */}
                  <div className="flex items-center gap-1 text-[10px]">
                    {isGpu && (
                      <>
                        <span className="text-zinc-600 font-mono truncate flex-1">
                          {(d as any).gpu}
                        </span>
                        <span className="text-green-600 font-bold font-mono">
                          {(d as any).spot}€/h
                        </span>
                      </>
                    )}
                    {isWeather && (
                      <>
                        <span className="text-zinc-600 font-mono">
                          {(d as any).temp_c}°C
                        </span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-zinc-600 font-mono">
                          {(d as any).wind_kmh}km/h
                        </span>
                        <span className="text-zinc-400 ml-auto font-mono">
                          {(d as any).solar_wm2}W
                        </span>
                      </>
                    )}
                    {isCarbon && (
                      <>
                        <span className="text-zinc-600 font-mono">
                          {(d as any).gco2_kwh}g/kWh
                        </span>
                        <span
                          className={`ml-auto text-[9px] font-bold ${
                            (d as any).index === "very low"
                              ? "text-emerald-600"
                              : (d as any).index === "low"
                              ? "text-green-600"
                              : (d as any).index === "moderate"
                              ? "text-amber-600"
                              : "text-red-500"
                          }`}
                        >
                          {(d as any).index}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Row 3: savings badge for GPU */}
                  {isGpu && (
                    <div className="flex items-center gap-1">
                      <div className="h-[1px] flex-1 bg-zinc-200" />
                      <span className="text-[8px] font-bold text-green-600/80 font-mono">
                        -{(d as any).savings_pct}% vs on-demand
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveDataFeed;
