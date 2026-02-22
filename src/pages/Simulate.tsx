import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, DollarSign, Leaf, MapPin, CheckCircle2, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import APILoadingAnimation from "@/components/APILoadingAnimation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type SimulateResponse } from "@/lib/api";
import { getCarbonEquivalents } from "@/lib/carbonEquivalents";
import nerveServeursData from "@/data/nerve_servers.json";

// Helper function to extract city name from server name
const getCityName = (serverName: string): string => {
  if (serverName.includes(" - ")) {
    const location = serverName.split(" - ")[1];
    return location.split(",")[0].trim();
  }
  return serverName;
};

// Get unique cities from servers
const getUniqueCities = (): string[] => {
  const cities = new Set<string>();
  nerveServeursData.forEach((server: any) => {
    const city = getCityName(server.name);
    cities.add(city);
  });
  return Array.from(cities);
};

// Generate server path with real cities and logical dates
const generateServerPath = (deadlineHours: number, spotPrice: number): Array<{ step: number; action: string; detail: string; date?: string }> => {
  const cities = getUniqueCities();
  const now = new Date();
  const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);
  
  // Select 2-3 different cities for realistic migration path
  // Prefer major datacenter cities
  const majorCities = cities.filter(city => 
    ['Amsterdam', 'Paris', 'London', 'Frankfurt', 'San Antonio', 'Tokyo', 'Singapore', 'Sydney', 'Toronto', 'Seoul'].includes(city)
  );
  const availableCities = majorCities.length >= 2 ? majorCities : cities;
  
  const selectedCities: string[] = [];
  const cityIndices = new Set<number>();
  const numCities = Math.min(3, availableCities.length);
  
  while (selectedCities.length < numCities && cityIndices.size < availableCities.length) {
    const idx = Math.floor(Math.random() * availableCities.length);
    if (!cityIndices.has(idx)) {
      cityIndices.add(idx);
      selectedCities.push(availableCities[idx]);
    }
  }
  
  // Calculate logical time intervals based on deadline
  // For short deadlines (< 12h), use smaller intervals
  // For longer deadlines, use more realistic distribution
  const isShortDeadline = deadlineHours < 12;
  const monitoringStart = isShortDeadline ? Math.min(2, deadlineHours * 0.15) : Math.min(4, deadlineHours * 0.1);
  const checkpointTime = isShortDeadline ? deadlineHours * 0.4 : deadlineHours * 0.35;
  const migrationTime = isShortDeadline ? deadlineHours * 0.7 : deadlineHours * 0.6;
  
  const formatDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month} ${hours}:${minutes}`;
  };
  
  // Generate realistic prices for different cities (slight variation)
  const basePrice = spotPrice;
  const priceVariation = (city: string, index: number) => {
    // Simulate price differences between regions
    const variation = 0.05 + (index * 0.03); // 5-11% variation
    const isCheaper = Math.random() > 0.5;
    return isCheaper 
      ? basePrice * (1 - variation)
      : basePrice * (1 + variation * 0.5);
  };
  
  const startCity = selectedCities[0];
  const startPrice = priceVariation(startCity, 0);
  const migrationCity = selectedCities.length > 1 ? selectedCities[1] : null;
  const migrationPrice = migrationCity ? priceVariation(migrationCity, 1) : null;
  
  // Calculate actual dates
  const date1 = now;
  const date2 = new Date(now.getTime() + monitoringStart * 60 * 60 * 1000);
  const date3 = new Date(now.getTime() + checkpointTime * 60 * 60 * 1000);
  const date4 = new Date(now.getTime() + migrationTime * 60 * 60 * 1000);
  const date5 = deadline;
  
  return [
    {
      step: 1,
      action: "Launch job",
      detail: `Start on ${startCity} at $${startPrice.toFixed(2)}/h`,
      date: formatDate(date1),
    },
    {
      step: 2,
      action: "Monitor prices",
      detail: `Track spot prices across ${selectedCities.length} regions`,
      date: formatDate(date2),
    },
    {
      step: 3,
      action: "Checkpoint",
      detail: "Save state every 15 minutes",
      date: formatDate(date3),
    },
    {
      step: 4,
      action: "Optimize",
      detail: migrationCity && migrationPrice && migrationPrice < startPrice
        ? `Migrate to ${migrationCity} at $${migrationPrice.toFixed(2)}/h (${((1 - migrationPrice/startPrice) * 100).toFixed(0)}% cheaper)`
        : migrationCity
        ? `Monitor ${migrationCity} for better prices`
        : "Continue monitoring for optimization",
      date: formatDate(date4),
    },
    {
      step: 5,
      action: "Complete",
      detail: "Job finished within deadline",
      date: formatDate(date5),
    },
  ];
};

type Step = "form" | "loading" | "results";

const Simulate = () => {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [form, setForm] = useState({
    job_type: "ml_training",
    gpu_hours: 24,
    min_gpu_memory_gb: 16,
    deadline_hours: 48,
  });
  const [gpuHoursInput, setGpuHoursInput] = useState("24");
  const [gpuMemoryInput, setGpuMemoryInput] = useState("16");
  
  // Helper to get default deadline (48 hours from now)
  const getDefaultDeadline = () => {
    const date = new Date();
    date.setHours(date.getHours() + 48);
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return date.toISOString().slice(0, 16);
  };
  const [deadlineDateTime, setDeadlineDateTime] = useState(getDefaultDeadline());

  // Mock data variants for different scenarios
  const getMockData = () => {
    const variants = [
      {
        savings: {
          spot_total_usd: 7.44,
          ondemand_total_usd: 88.08,
          saved_usd: 80.64,
          saved_eur: 74.19,
          savings_pct: 91.5,
        },
        green_impact: {
          total_kwh: 48,
          total_co2_kg: 2.4,
          co2_vs_worst_region_kg: 8.2,
          equivalent: "2 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 12.30,
          ondemand_total_usd: 145.60,
          saved_usd: 133.30,
          saved_eur: 122.64,
          savings_pct: 91.5,
        },
        green_impact: {
          total_kwh: 72,
          total_co2_kg: 1.8,
          co2_vs_worst_region_kg: 12.5,
          equivalent: "1.5 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 5.20,
          ondemand_total_usd: 62.40,
          saved_usd: 57.20,
          saved_eur: 52.66,
          savings_pct: 91.7,
        },
        green_impact: {
          total_kwh: 36,
          total_co2_kg: 1.2,
          co2_vs_worst_region_kg: 6.8,
          equivalent: "1 flight Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 18.75,
          ondemand_total_usd: 220.50,
          saved_usd: 201.75,
          saved_eur: 185.61,
          savings_pct: 91.5,
        },
        green_impact: {
          total_kwh: 96,
          total_co2_kg: 3.8,
          co2_vs_worst_region_kg: 15.2,
          equivalent: "3.2 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 9.60,
          ondemand_total_usd: 115.20,
          saved_usd: 105.60,
          saved_eur: 97.15,
          savings_pct: 91.7,
        },
        green_impact: {
          total_kwh: 54,
          total_co2_kg: 1.5,
          co2_vs_worst_region_kg: 9.3,
          equivalent: "1.25 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 15.40,
          ondemand_total_usd: 184.80,
          saved_usd: 169.40,
          saved_eur: 155.85,
          savings_pct: 91.7,
        },
        green_impact: {
          total_kwh: 84,
          total_co2_kg: 2.9,
          co2_vs_worst_region_kg: 11.6,
          equivalent: "2.4 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 6.80,
          ondemand_total_usd: 81.60,
          saved_usd: 74.80,
          saved_eur: 68.82,
          savings_pct: 91.7,
        },
        green_impact: {
          total_kwh: 42,
          total_co2_kg: 1.1,
          co2_vs_worst_region_kg: 5.2,
          equivalent: "0.9 flights Paris-New York",
        },
      },
      {
        savings: {
          spot_total_usd: 22.50,
          ondemand_total_usd: 270.00,
          saved_usd: 247.50,
          saved_eur: 227.70,
          savings_pct: 91.7,
        },
        green_impact: {
          total_kwh: 120,
          total_co2_kg: 4.5,
          co2_vs_worst_region_kg: 18.0,
          equivalent: "3.75 flights Paris-New York",
        },
      },
    ];

    // Select variant based on GPU hours and job type for variety
    const variantIndex = (form.gpu_hours + form.job_type.length) % variants.length;
    const selectedVariant = variants[variantIndex];

    // Scale values based on GPU hours
    const scaleFactor = form.gpu_hours / 24;
    const scaledSavings = {
      spot_total_usd: selectedVariant.savings.spot_total_usd * scaleFactor,
      ondemand_total_usd: selectedVariant.savings.ondemand_total_usd * scaleFactor,
      saved_usd: selectedVariant.savings.saved_usd * scaleFactor,
      saved_eur: selectedVariant.savings.saved_eur * scaleFactor,
      savings_pct: selectedVariant.savings.savings_pct + (Math.random() * 2 - 1), // ±1% variation
    };

    const scaledGreenImpact = {
      total_kwh: selectedVariant.green_impact.total_kwh * scaleFactor,
      total_co2_kg: selectedVariant.green_impact.total_co2_kg * scaleFactor,
      co2_vs_worst_region_kg: selectedVariant.green_impact.co2_vs_worst_region_kg * scaleFactor,
      equivalent: selectedVariant.green_impact.equivalent,
    };

    return { scaledSavings, scaledGreenImpact };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStep("loading");

    try {
      // Convert form to API format
      const requestBody = {
        model_name: form.job_type === "ml_training" ? "LLaMA-7B" : undefined,
        gpu_hours: form.gpu_hours,
        min_gpu_memory_gb: form.min_gpu_memory_gb,
        deadline_hours: form.deadline_hours,
      };

      const res = await api.simulate(requestBody);
      setResult(res);
      setStep("results");
    } catch (error) {
      console.error("Simulation error:", error);
      // On error, show mock data for demo with variations
      const { scaledSavings, scaledGreenImpact } = getMockData();
      const estimatedSpotPrice = 0.31;
      const serverPath = generateServerPath(form.deadline_hours, estimatedSpotPrice);
      
      setResult({
        decision: {
          region: "francecentral",
          az: "eu-west-3a",
          gpu_sku: "Standard_NC6s_v3",
          gpu_name: "NVIDIA V100",
          strategy: "spot_optimized",
          estimated_spot_price: estimatedSpotPrice,
          reason: "Best price-to-performance ratio with low carbon intensity",
        },
        fallback_gpu: {
          sku: "Standard_NC12s_v3",
          gpu_name: "NVIDIA V100",
          spot_price: 0.62,
          reason: "Higher capacity if primary unavailable",
        },
        checkpointing: {
          interval_min: 15,
          estimated_size_gb: 12,
          storage: "Azure Blob Storage",
        },
        savings: scaledSavings,
        green_impact: scaledGreenImpact,
        server_path: serverPath,
        risk_assessment: {
          interruption_probability: "Low (5%)",
          risk_level: "low",
          mitigation: "Auto-migration to backup AZ in 28s if evicted",
        },
      });
      setStep("results");
    } finally {
      setLoading(false);
    }
  };

  const carbonEquivalents = result ? getCarbonEquivalents(result.green_impact.total_co2_kg) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Launch your first job</CardTitle>
                  <CardDescription>
                    Tell us about your workload and we'll find the optimal spot GPU
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="job_type">Job Type</Label>
                    <Select
                      value={form.job_type}
                      onValueChange={(value) => setForm({ ...form, job_type: value })}
                    >
                      <SelectTrigger id="job_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml_training">ML Training</SelectItem>
                        <SelectItem value="data_processing">Data Processing</SelectItem>
                        <SelectItem value="batch_analytics">Batch Analytics</SelectItem>
                        <SelectItem value="rendering">3D Rendering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpu_hours">GPU Hours Needed</Label>
                    <Input
                      id="gpu_hours"
                      type="number"
                      min="1"
                      max="1000"
                      value={gpuHoursInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setGpuHoursInput(value);
                        if (value !== "") {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            setForm({ ...form, gpu_hours: numValue });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (gpuHoursInput === "" || parseInt(gpuHoursInput) < 1) {
                          setGpuHoursInput("24");
                          setForm({ ...form, gpu_hours: 24 });
                        } else {
                          setGpuHoursInput(form.gpu_hours.toString());
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_gpu_memory_gb">Minimum GPU Memory (GB)</Label>
                    <Input
                      id="min_gpu_memory_gb"
                      type="number"
                      min="8"
                      max="80"
                      value={gpuMemoryInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setGpuMemoryInput(value);
                        if (value !== "") {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            setForm({ ...form, min_gpu_memory_gb: numValue });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (gpuMemoryInput === "" || parseInt(gpuMemoryInput) < 8) {
                          setGpuMemoryInput("16");
                          setForm({ ...form, min_gpu_memory_gb: 16 });
                        } else {
                          setGpuMemoryInput(form.min_gpu_memory_gb.toString());
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadlineDateTime}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const selectedDateTime = e.target.value;
                        setDeadlineDateTime(selectedDateTime);
                        if (selectedDateTime) {
                          const selectedDate = new Date(selectedDateTime);
                          const now = new Date();
                          const diffHours = Math.max(1, Math.round((selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
                          setForm({ ...form, deadline_hours: diffHours });
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="lg"
                  >
                    Find best spot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analyzing 12 regions...</CardTitle>
                  <CardDescription>We're calling our APIs to find the best spot GPU</CardDescription>
                </CardHeader>
                <CardContent>
                  <APILoadingAnimation
                    onComplete={() => {
                      // Animation completes, but we wait for API response
                      // The step will change to "results" when API responds
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Savings Card */}
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Your Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-4xl font-bold text-emerald-600">
                        +{result.savings.saved_eur.toFixed(2)}€
                      </div>
                      <div className="text-sm text-zinc-600 mt-1">
                        {result.savings.savings_pct.toFixed(1)}% cheaper than on-demand
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200">
                      <div>
                        <div className="text-xs text-zinc-500">Spot Price</div>
                        <div className="text-lg font-semibold">{result.savings.spot_total_usd.toFixed(2)}€</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">On-Demand Price</div>
                        <div className="text-lg font-semibold line-through text-zinc-400">
                          {result.savings.ondemand_total_usd.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carbon Impact Card */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Carbon Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-4xl font-bold text-green-600">
                        {result.green_impact.total_co2_kg.toFixed(2)} kg CO₂
                      </div>
                      <div className="text-sm text-zinc-600 mt-1">
                        {result.green_impact.total_kwh.toFixed(0)} kWh consumed
                      </div>
                    </div>
                    {carbonEquivalents.length > 0 && (
                      <div className="pt-4 border-t border-green-200">
                        <div className="text-sm font-medium text-zinc-700 mb-2">Environmental equivalent:</div>
                        {carbonEquivalents.map((equiv, idx) => (
                          <div key={idx} className="text-sm text-zinc-600">
                            {equiv.text}
                          </div>
                        ))}
                      </div>
                    )}
                    {result.green_impact.co2_vs_worst_region_kg > 0 && (
                      <div className="pt-2 text-xs text-green-700">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        {result.green_impact.co2_vs_worst_region_kg.toFixed(1)} kg CO₂ saved vs worst region
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Path Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Predicted Path
                  </CardTitle>
                  <CardDescription>How your job will run until the deadline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.server_path.map((pathStep, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                            {pathStep.step}
                          </div>
                          {idx < result.server_path.length - 1 && (
                            <div className="w-0.5 h-full bg-zinc-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-zinc-900">{pathStep.action}</div>
                            {pathStep.date && (
                              <div className="text-xs text-zinc-400 font-mono">{pathStep.date}</div>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">{pathStep.detail}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Decision Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimal Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Region</div>
                      <div className="font-semibold">{result.decision.region}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Availability Zone</div>
                      <div className="font-semibold">{result.decision.az}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">GPU</div>
                      <div className="font-semibold">{result.decision.gpu_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Price</div>
                      <div className="font-semibold">{result.decision.estimated_spot_price}€/h</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Reason</div>
                    <div className="text-sm text-zinc-700">{result.decision.reason}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">Interruption Probability</span>
                      <span className="text-sm font-semibold">{result.risk_assessment.interruption_probability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600">Risk Level</span>
                      <span className="text-sm font-semibold capitalize">{result.risk_assessment.risk_level}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200">
                      <div className="text-xs text-zinc-500 mb-1">Mitigation</div>
                      <div className="text-sm text-zinc-700">{result.risk_assessment.mitigation}</div>
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
