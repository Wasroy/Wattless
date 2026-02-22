import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  ArrowRight,
  DollarSign,
  Leaf,
  Shield,
  AlertTriangle,
  Server,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type SimulateResponse } from "@/lib/api";

const Simulate = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [form, setForm] = useState({
    model_name: "LLaMA-7B",
    gpu_hours: 24,
    min_gpu_memory_gb: 16,
    deadline_hours: 48,
  });

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await api.simulate(form);
      setResult(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level: string) => {
    if (level === "low") return "text-green-600 bg-green-50 border-green-200";
    if (level === "medium") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Simulate Job
          </h1>
          <p className="text-muted-foreground">
            NERVE analyzes live GPU prices, carbon intensity, and availability to
            find the optimal placement
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Job Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Model Name
                  </Label>
                  <Input
                    value={form.model_name}
                    onChange={(e) =>
                      setForm({ ...form, model_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    GPU Hours
                  </Label>
                  <Input
                    type="number"
                    value={form.gpu_hours}
                    onChange={(e) =>
                      setForm({ ...form, gpu_hours: +e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Min GPU Memory (GB)
                  </Label>
                  <Input
                    type="number"
                    value={form.min_gpu_memory_gb}
                    onChange={(e) =>
                      setForm({ ...form, min_gpu_memory_gb: +e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Deadline (hours)
                  </Label>
                  <Input
                    type="number"
                    value={form.deadline_hours}
                    onChange={(e) =>
                      setForm({ ...form, deadline_hours: +e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Cpu className="h-4 w-4 mr-2" />
                )}
                Run NERVE Simulation
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Decision */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    NERVE Decision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Region</p>
                      <p className="font-semibold">{result.decision.region}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Availability Zone
                      </p>
                      <p className="font-semibold font-mono text-sm">
                        {result.decision.az}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GPU</p>
                      <p className="font-semibold">{result.decision.gpu_name}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {result.decision.gpu_sku}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Strategy</p>
                      <Badge variant="outline">{result.decision.strategy}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Spot Price
                      </p>
                      <p className="font-mono font-bold text-green-600">
                        ${result.decision.estimated_spot_price.toFixed(4)}/h
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                    {result.decision.reason}
                  </p>
                </CardContent>
              </Card>

              {/* Savings + Green Impact */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Spot Total
                        </span>
                        <span className="font-mono font-semibold">
                          ${result.savings.spot_total_usd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          On-Demand Total
                        </span>
                        <span className="font-mono text-muted-foreground line-through">
                          ${result.savings.ondemand_total_usd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium">You Save</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-green-600 text-lg">
                            ${result.savings.saved_usd.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({result.savings.savings_pct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-emerald-600" />
                      Green Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Energy
                        </span>
                        <span className="font-mono">
                          {result.green_impact.total_kwh.toFixed(1)} kWh
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          CO2
                        </span>
                        <span className="font-mono">
                          {result.green_impact.total_co2_kg.toFixed(2)} kg
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          CO2 vs worst region
                        </span>
                        <span className="font-mono font-semibold text-emerald-600">
                          -{result.green_impact.co2_vs_worst_region_kg.toFixed(2)}{" "}
                          kg saved
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        {result.green_impact.equivalent}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Server Path */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Server Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.server_path.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk + Checkpointing */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={riskColor(result.risk_assessment.risk_level)}
                        >
                          {result.risk_assessment.risk_level.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.risk_assessment.interruption_probability}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.risk_assessment.mitigation}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Checkpointing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Interval
                        </span>
                        <span className="font-mono text-sm">
                          {result.checkpointing.interval_min} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Size
                        </span>
                        <span className="font-mono text-sm">
                          {result.checkpointing.estimated_size_gb} GB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Storage
                        </span>
                        <span className="font-mono text-sm">
                          {result.checkpointing.storage}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fallback */}
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Fallback: {result.fallback_gpu.gpu_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.fallback_gpu.sku} — $
                        {result.fallback_gpu.spot_price.toFixed(4)}/h —{" "}
                        {result.fallback_gpu.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Simulate;
