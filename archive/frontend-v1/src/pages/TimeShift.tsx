import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  TrendingDown,
  Leaf,
  Sun,
  Moon,
  Loader2,
  ArrowDown,
  Zap,
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
import { api, type TimeShiftPlan } from "@/lib/api";

const TimeShift = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimeShiftPlan | null>(null);
  const [form, setForm] = useState({
    job_type: "llm_fine_tuning",
    gpu_hours: 24,
    deadline_hours: 48,
    preferred_region: "francecentral",
  });

  const handlePlan = async () => {
    setLoading(true);
    try {
      const res = await api.timeshiftPlan(form);
      setResult(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
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
            Time-Shifting
          </h1>
          <p className="text-muted-foreground">
            NERVE analyzes 24h price and carbon curves to find the cheapest,
            greenest window to run your job
          </p>
        </motion.div>

        {/* Concept */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Sun className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Peak Hours</p>
                <p className="text-xs text-muted-foreground mt-1">
                  High prices, high carbon
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <ArrowDown className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">NERVE Shifts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Delays to optimal window
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-green-200 bg-green-50/30">
              <CardContent className="pt-6">
                <Moon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Off-Peak</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cheap prices, wind energy
                </p>
              </CardContent>
            </Card>
          </div>
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
                <Clock className="h-4 w-4" />
                Job Configuration
              </CardTitle>
              <CardDescription>
                Define your job and deadline — NERVE will find the best time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Job Type
                  </Label>
                  <Input
                    value={form.job_type}
                    onChange={(e) =>
                      setForm({ ...form, job_type: e.target.value })
                    }
                    className="mt-1 text-sm"
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
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Region
                  </Label>
                  <Input
                    value={form.preferred_region}
                    onChange={(e) =>
                      setForm({ ...form, preferred_region: e.target.value })
                    }
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handlePlan}
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Find Optimal Window
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
              className="space-y-4"
            >
              {/* Recommendation */}
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    NERVE Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Optimal Start Time
                      </p>
                      <p className="text-2xl font-bold">
                        {result.recommended_start}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Region: {result.recommended_region}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Reason
                      </p>
                      <p className="text-sm">{result.reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Savings Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Price */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      Price Reduction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Now</p>
                          <p className="font-mono text-lg">
                            ${result.price_now.toFixed(4)}/h
                          </p>
                        </div>
                        <ArrowDown className="h-5 w-5 text-green-600" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Optimal
                          </p>
                          <p className="font-mono text-lg font-bold text-green-600">
                            ${result.price_optimal.toFixed(4)}/h
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge className="text-sm px-4 py-1">
                          -{result.price_reduction_pct.toFixed(1)}% cheaper
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carbon */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-emerald-600" />
                      Carbon Reduction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Now</p>
                          <p className="font-mono text-lg">
                            {result.carbon_now.toFixed(0)} gCO2
                          </p>
                        </div>
                        <ArrowDown className="h-5 w-5 text-emerald-600" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Optimal
                          </p>
                          <p className="font-mono text-lg font-bold text-emerald-600">
                            {result.carbon_optimal.toFixed(0)} gCO2
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge
                          variant="outline"
                          className="text-sm px-4 py-1 text-emerald-600 border-emerald-200"
                        >
                          -{result.carbon_reduction_pct.toFixed(1)}% cleaner
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default TimeShift;
