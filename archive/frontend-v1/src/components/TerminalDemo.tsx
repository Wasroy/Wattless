import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

interface Line {
  text: string;
  type: "command" | "info" | "success" | "warning" | "result" | "blank" | "table";
}

const gpuOptions = [
  { id: "a100", label: "A100" },
  { id: "h100", label: "H100" },
  { id: "v100", label: "V100" },
  { id: "t4", label: "T4" },
];

const outputs: Record<string, Line[]> = {
  a100: [
    { text: "$ nerve scan --gpu a100 --regions all", type: "command" },
    { text: "Scanning 12 regions...", type: "info" },
    { text: "", type: "blank" },
    { text: "\u2713 Found 47 Spot A100 instances", type: "success" },
    { text: "", type: "blank" },
    { text: "  Region            Price     Carbon    Risk", type: "table" },
    { text: "  UK South          $0.31/h   45g       Low", type: "table" },
    { text: "  North Europe      $0.35/h   38g       Low", type: "table" },
    { text: "  East US           $0.42/h   410g      Med", type: "table" },
    { text: "  Southeast Asia    $0.38/h   520g      High", type: "table" },
    { text: "", type: "blank" },
    { text: "$ nerve deploy --region uksouth --checkpoint 30s", type: "command" },
    { text: "\u2713 Deployed on Standard_NC24ads_A100_v4", type: "success" },
    { text: "\u2713 Checkpoint: every 30s", type: "success" },
    { text: "\u2713 Training started \u2014 ETA 3h 42m", type: "success" },
    { text: "", type: "blank" },
    { text: "\u26a0 [EVICTION] Spot preemption in UK South", type: "warning" },
    { text: "  Saving checkpoint... done (2.1 GB in 4s)", type: "info" },
    { text: "  Migrating to northeurope...", type: "info" },
    { text: "\u2713 Restored in 28s. Zero data loss.", type: "success" },
    { text: "", type: "blank" },
    { text: "$ nerve report", type: "command" },
    { text: "", type: "blank" },
    { text: "  Cost:   $12.40   (vs $98.40 on-demand \u2014 87% saved)", type: "result" },
    { text: "  CO\u2082:    2.1 kg   (vs 19.0 kg \u2014 89% reduction)", type: "result" },
    { text: "  Time:   3h 42m   (1 migration, 0 felt)", type: "result" },
  ],
  h100: [
    { text: "$ nerve scan --gpu h100 --regions all", type: "command" },
    { text: "Scanning 12 regions...", type: "info" },
    { text: "", type: "blank" },
    { text: "\u2713 Found 23 Spot H100 instances", type: "success" },
    { text: "", type: "blank" },
    { text: "  Region            Price     Carbon    Risk", type: "table" },
    { text: "  West Europe       $1.08/h   95g       Med", type: "table" },
    { text: "  North Europe      $1.15/h   38g       Low", type: "table" },
    { text: "  East US 2         $1.22/h   380g      Med", type: "table" },
    { text: "  Central India     $0.98/h   620g      High", type: "table" },
    { text: "", type: "blank" },
    { text: "$ nerve deploy --region westeurope --checkpoint 20s", type: "command" },
    { text: "\u2713 Deployed on Standard_NC40ads_H100_v5", type: "success" },
    { text: "\u2713 Training started \u2014 ETA 1h 55m", type: "success" },
    { text: "", type: "blank" },
    { text: "$ nerve report", type: "command" },
    { text: "", type: "blank" },
    { text: "  Cost:   $8.30    (vs $64.40 on-demand \u2014 87% saved)", type: "result" },
    { text: "  CO\u2082:    1.4 kg   (vs 14.2 kg \u2014 90% reduction)", type: "result" },
    { text: "  Time:   1h 55m   (0 migrations)", type: "result" },
  ],
  v100: [
    { text: "$ nerve scan --gpu v100 --regions all", type: "command" },
    { text: "Scanning 12 regions...", type: "info" },
    { text: "", type: "blank" },
    { text: "\u2713 Found 82 Spot V100 instances", type: "success" },
    { text: "", type: "blank" },
    { text: "  Region            Price     Carbon    Risk", type: "table" },
    { text: "  UK South          $0.12/h   45g       Low", type: "table" },
    { text: "  France Central    $0.14/h   52g       Low", type: "table" },
    { text: "  West US           $0.18/h   290g      Low", type: "table" },
    { text: "  Japan East        $0.15/h   480g      Med", type: "table" },
    { text: "", type: "blank" },
    { text: "$ nerve deploy --region uksouth --checkpoint 60s", type: "command" },
    { text: "\u2713 Deployed on Standard_NC6s_v3", type: "success" },
    { text: "\u2713 Training started \u2014 ETA 8h 10m", type: "success" },
    { text: "", type: "blank" },
    { text: "$ nerve report", type: "command" },
    { text: "", type: "blank" },
    { text: "  Cost:   $4.92    (vs $40.80 on-demand \u2014 88% saved)", type: "result" },
    { text: "  CO\u2082:    0.8 kg   (vs 8.6 kg \u2014 91% reduction)", type: "result" },
    { text: "  Time:   8h 10m   (2 migrations, 0 felt)", type: "result" },
  ],
  t4: [
    { text: "$ nerve scan --gpu t4 --regions all", type: "command" },
    { text: "Scanning 12 regions...", type: "info" },
    { text: "", type: "blank" },
    { text: "\u2713 Found 124 Spot T4 instances", type: "success" },
    { text: "", type: "blank" },
    { text: "  Region            Price     Carbon    Risk", type: "table" },
    { text: "  North Europe      $0.04/h   38g       Low", type: "table" },
    { text: "  UK South          $0.05/h   45g       Low", type: "table" },
    { text: "  East US           $0.07/h   410g      Low", type: "table" },
    { text: "  Korea Central     $0.06/h   350g      Med", type: "table" },
    { text: "", type: "blank" },
    { text: "$ nerve deploy --region northeurope --checkpoint 120s", type: "command" },
    { text: "\u2713 Deployed on Standard_NC4as_T4_v3", type: "success" },
    { text: "\u2713 Inference started", type: "success" },
    { text: "", type: "blank" },
    { text: "$ nerve report", type: "command" },
    { text: "", type: "blank" },
    { text: "  Cost:   $0.96    (vs $8.40 on-demand \u2014 89% saved)", type: "result" },
    { text: "  CO\u2082:    0.2 kg   (vs 2.1 kg \u2014 90% reduction)", type: "result" },
    { text: "  Time:   24h      (0 migrations)", type: "result" },
  ],
};

const colorMap: Record<Line["type"], string> = {
  command: "text-emerald-400",
  info: "text-zinc-500",
  success: "text-emerald-400",
  warning: "text-amber-400",
  result: "text-white font-medium",
  blank: "",
  table: "text-zinc-400",
};

const TerminalDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  const [selectedGpu, setSelectedGpu] = useState("a100");
  const [animKey, setAnimKey] = useState(0);

  const lines = outputs[selectedGpu];

  const handleGpuChange = (id: string) => {
    setSelectedGpu(id);
    setAnimKey((k) => k + 1);
  };

  return (
    <section className="py-24">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-emerald-600 tracking-widest uppercase mb-3">
            One command
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Scan. Deploy. Relax.
          </h2>
          <p className="text-zinc-400 text-sm">
            Pick a GPU and watch what happens when cloud prices meet automation.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {gpuOptions.map((gpu) => (
            <button
              key={gpu.id}
              onClick={() => handleGpuChange(gpu.id)}
              className={`px-4 py-2 font-mono text-xs font-medium rounded-lg transition-all ${
                selectedGpu === gpu.id
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-400 hover:text-foreground hover:bg-zinc-200"
              }`}
            >
              {gpu.label}
            </button>
          ))}
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200/50 border border-zinc-200">
            <div className="px-4 py-3 flex items-center gap-2 bg-zinc-900 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 ml-2">
                nerve-cli v0.1.0
              </span>
            </div>

            <div className="bg-zinc-950 p-6 font-mono text-[13px] leading-7 min-h-[420px] overflow-x-auto">
              {lines.map((line, i) => (
                <motion.div
                  key={`${animKey}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.1 }}
                  className={`whitespace-pre ${colorMap[line.type]}`}
                >
                  {line.text || "\u00A0"}
                </motion.div>
              ))}
              <motion.span
                key={`cursor-${animKey}`}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                transition={{
                  delay: lines.length * 0.05 + 0.3,
                  duration: 1,
                  repeat: Infinity,
                }}
                className="text-emerald-400"
              >
                _
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TerminalDemo;
