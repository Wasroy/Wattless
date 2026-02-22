import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  HardDrive,
  Server,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
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
import { api, type CheckpointEvent } from "@/lib/api";

const Checkpoint = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckpointEvent | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [form, setForm] = useState({
    job_id: "llama-finetune-001",
    current_az: "fr-central-1",
    model_size_gb: 14,
    progress_pct: 67,
  });

  const handleSimulate = async () => {
    setLoading(true);
    setVisibleSteps(0);
    setResult(null);
    try {
      const res = await api.checkpointSimulate(form);
      setResult(res);
      // Animate steps one by one
      res.timeline.forEach((_, i) => {
        setTimeout(() => setVisibleSteps(i + 1), (i + 1) * 400);
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const stepIcon = (event: string) => {
    if (event.includes("interrupt") || event.includes("Interrupt"))
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (event.includes("save") || event.includes("Save") || event.includes("checkpoint"))
      return <HardDrive className="h-4 w-4 text-blue-500" />;
    if (event.includes("upload") || event.includes("Upload"))
      return <ArrowRight className="h-4 w-4 text-violet-500" />;
    if (event.includes("cordon") || event.includes("Cordon"))
      return <Shield className="h-4 w-4 text-amber-500" />;
    if (event.includes("provision") || event.includes("Provision") || event.includes("GPU"))
      return <Server className="h-4 w-4 text-cyan-500" />;
    if (event.includes("download") || event.includes("Download"))
      return <HardDrive className="h-4 w-4 text-indigo-500" />;
    if (event.includes("resum") || event.includes("Resum"))
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Smart Checkpointing
          </h1>
          <p className="text-muted-foreground">
            Simulate a Spot interruption and watch NERVE's evacuation protocol
            in action — zero data loss
          </p>
        </motion.div>

        {/* Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Active Job Context
              </CardTitle>
              <CardDescription>
                Configure the running job to evacuate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Job ID
                  </Label>
                  <Input
                    value={form.job_id}
                    onChange={(e) =>
                      setForm({ ...form, job_id: e.target.value })
                    }
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Current AZ
                  </Label>
                  <Input
                    value={form.current_az}
                    onChange={(e) =>
                      setForm({ ...form, current_az: e.target.value })
                    }
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Model Size (GB)
                  </Label>
                  <Input
                    type="number"
                    value={form.model_size_gb}
                    onChange={(e) =>
                      setForm({ ...form, model_size_gb: +e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Progress (%)
                  </Label>
                  <Input
                    type="number"
                    value={form.progress_pct}
                    onChange={(e) =>
                      setForm({ ...form, progress_pct: +e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleSimulate}
                disabled={loading}
                variant="destructive"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Trigger Spot Interruption
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Migration Header */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-sm font-semibold">
                        {result.from_az}
                      </div>
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                      <div className="font-mono text-sm font-semibold">
                        {result.to_az}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {result.checkpoint_size_gb.toFixed(1)} GB checkpoint
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200"
                      >
                        {result.data_loss}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Evacuation Timeline
                  </CardTitle>
                  <CardDescription>
                    Total duration: {result.total_duration_sec.toFixed(1)}s
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-1">
                      {result.timeline.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={
                            i < visibleSteps
                              ? { opacity: 1, x: 0 }
                              : { opacity: 0.2, x: 0 }
                          }
                          transition={{ duration: 0.3 }}
                          className="flex items-start gap-4 py-3 pl-2"
                        >
                          <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 border-border shrink-0">
                            {stepIcon(step.event)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                T+{step.t_sec.toFixed(1)}s
                              </span>
                              <span className="text-sm font-medium">
                                {step.event}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {step.detail}
                            </p>
                          </div>
                          {i < visibleSteps && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              {visibleSteps >= result.timeline.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-green-200 bg-green-50/30">
                    <CardContent className="pt-6 pb-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-bold mb-1">
                        Migration Complete
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Job <span className="font-mono">{result.job_id}</span>{" "}
                        migrated from{" "}
                        <span className="font-mono">{result.from_az}</span> to{" "}
                        <span className="font-mono">{result.to_az}</span> in{" "}
                        <span className="font-semibold">
                          {result.total_duration_sec.toFixed(1)}s
                        </span>{" "}
                        with{" "}
                        <span className="font-semibold text-green-600">
                          {result.data_loss}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Checkpoint;
