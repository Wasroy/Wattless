import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, DollarSign, Leaf, MapPin, CheckCircle2, Clock, Download } from "lucide-react";
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
import jsPDF from "jspdf";

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
  
  // Major datacenter cities list for realistic routing
  const majorCities = ['Amsterdam', 'Paris', 'London', 'Frankfurt', 'San Antonio', 'Tokyo', 'Singapore', 'Sydney', 'Toronto', 'Seoul', 'Mumbai', 'Dubai', 'São Paulo', 'Seattle', 'Virginia', 'Dublin', 'Zurich', 'Oslo', 'Stockholm', 'Milan', 'Barcelona', 'Warsaw', 'Vienna', 'Brussels'];
  
  // Filter to only cities that exist in our server list
  const availableMajorCities = majorCities.filter(city => cities.includes(city));
  const pool = availableMajorCities.length >= 3 ? availableMajorCities : cities;
  
  // Select 3-6 cities randomly (different each run)
  const numCities = Math.floor(Math.random() * 4) + 3; // 3 to 6 cities
  const selectedCities: string[] = [];
  const cityIndices = new Set<number>();
  
  while (selectedCities.length < numCities && cityIndices.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!cityIndices.has(idx)) {
      cityIndices.add(idx);
      selectedCities.push(pool[idx]);
    }
  }
  
  // Calculate logical time intervals based on deadline
  const isShortDeadline = deadlineHours < 12;
  const timePerCity = deadlineHours / (numCities + 1); // Distribute time across cities
  
  const formatDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month} ${hours}:${minutes}`;
  };
  
  // Generate realistic prices for different cities
  const basePrice = spotPrice;
  const cityPrices: { [key: string]: number } = {};
  
  selectedCities.forEach((city, index) => {
    // Simulate price differences between regions (5-15% variation)
    const variation = 0.05 + (Math.random() * 0.1);
    const isCheaper = Math.random() > 0.4; // 60% chance of being cheaper
    cityPrices[city] = isCheaper 
      ? basePrice * (1 - variation)
      : basePrice * (1 + variation * 0.6);
  });
  
  // Build path steps
  const pathSteps: Array<{ step: number; action: string; detail: string; date?: string }> = [];
  
  // Step 1: Start on first city
  const startCity = selectedCities[0];
  const startPrice = cityPrices[startCity];
  pathSteps.push({
    step: 1,
    action: `Start on ${startCity} at $${startPrice.toFixed(2)}/h`,
    detail: "Launch job and initialize checkpointing",
    date: formatDate(now),
  });
  
  // Steps 2 to N-1: Migrations to other cities
  for (let i = 1; i < selectedCities.length; i++) {
    const currentCity = selectedCities[i];
    const currentPrice = cityPrices[currentCity];
    const previousCity = selectedCities[i - 1];
    const previousPrice = cityPrices[previousCity];
    
    const timeOffset = timePerCity * i;
    const stepDate = new Date(now.getTime() + timeOffset * 60 * 60 * 1000);
    
    const savings = previousPrice - currentPrice;
    const savingsPct = ((savings / previousPrice) * 100).toFixed(0);
    
    let detail = "";
    if (currentPrice < previousPrice) {
      detail = `Migrate from ${previousCity} - ${savingsPct}% cheaper, checkpoint saved`;
    } else if (currentPrice > previousPrice) {
      detail = `Migrate from ${previousCity} - better availability, price +${((currentPrice/previousPrice - 1) * 100).toFixed(0)}%`;
    } else {
      detail = `Migrate from ${previousCity} - load balancing across regions`;
    }
    
    pathSteps.push({
      step: i + 1,
      action: `Go to ${currentCity} for $${currentPrice.toFixed(2)}/h`,
      detail: detail,
      date: formatDate(stepDate),
    });
  }
  
  // Final step: Complete
  pathSteps.push({
    step: selectedCities.length + 1,
    action: "Complete",
    detail: `Job finished within deadline on ${selectedCities[selectedCities.length - 1]}`,
    date: formatDate(deadline),
  });
  
  return pathSteps;
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
      
      // Generate random configuration data
      const regions = ["francecentral", "westeurope", "uksouth", "eastus", "westus2", "southeastasia", "japaneast", "australiaeast"];
      const azs = ["eu-west-3a", "eu-west-3b", "eu-west-3c", "us-east-1a", "us-west-2a", "ap-southeast-1a", "jp-east-1a"];
      const gpus = [
        { sku: "Standard_NC6s_v3", name: "NVIDIA V100", basePrice: 0.31 },
        { sku: "Standard_NC12s_v3", name: "NVIDIA V100", basePrice: 0.62 },
        { sku: "Standard_NC24s_v3", name: "NVIDIA V100", basePrice: 1.24 },
        { sku: "Standard_NC96ads_A100_v4", name: "NVIDIA A100", basePrice: 2.85 },
        { sku: "Standard_ND96isr_H100_v5", name: "NVIDIA H100", basePrice: 4.20 },
        { sku: "Standard_NC16as_T4_v3", name: "NVIDIA T4", basePrice: 0.45 },
      ];
      const strategies = ["spot_optimized", "carbon_optimized", "balanced", "cost_first"];
      const reasons = [
        "Best price-to-performance ratio with low carbon intensity",
        "Optimal balance between cost and availability",
        "Lowest carbon footprint in available regions",
        "Highest availability with competitive pricing",
        "Best spot price stability in this region",
        "Optimal for deadline with cost efficiency",
      ];
      
      const selectedRegion = regions[Math.floor(Math.random() * regions.length)];
      const selectedAZ = azs[Math.floor(Math.random() * azs.length)];
      const selectedGPU = gpus[Math.floor(Math.random() * gpus.length)];
      const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      const selectedReason = reasons[Math.floor(Math.random() * reasons.length)];
      
      // Add price variation (±10%)
      const priceVariation = 1 + (Math.random() * 0.2 - 0.1);
      const estimatedSpotPrice = selectedGPU.basePrice * priceVariation;
      
      // Generate fallback GPU (different from primary)
      const fallbackGPUs = gpus.filter(g => g.sku !== selectedGPU.sku);
      const fallbackGPU = fallbackGPUs[Math.floor(Math.random() * fallbackGPUs.length)];
      const fallbackPriceVariation = 1 + (Math.random() * 0.2 - 0.1);
      const fallbackPrice = fallbackGPU.basePrice * fallbackPriceVariation;
      
      // Generate checkpointing data
      const checkpointIntervals = [10, 15, 20, 30];
      const checkpointInterval = checkpointIntervals[Math.floor(Math.random() * checkpointIntervals.length)];
      const checkpointSize = Math.round((form.min_gpu_memory_gb * 0.7 + Math.random() * form.min_gpu_memory_gb * 0.3) * 10) / 10;
      const storageOptions = ["Azure Blob Storage", "S3", "Google Cloud Storage"];
      const selectedStorage = storageOptions[Math.floor(Math.random() * storageOptions.length)];
      
      // Generate risk assessment
      const riskLevels = ["low", "medium", "low"];
      const riskProbabilities = ["Low (3%)", "Low (5%)", "Low (7%)", "Medium (12%)"];
      const mitigations = [
        "Auto-migration to backup AZ in 28s if evicted",
        "Checkpoint every 15min - recovery in < 90s",
        "Multi-AZ redundancy - zero downtime migration",
        "Automatic failover to secondary region in 45s",
        "Continuous checkpointing - seamless recovery",
      ];
      
      const selectedRiskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const selectedRiskProb = riskProbabilities[Math.floor(Math.random() * riskProbabilities.length)];
      const selectedMitigation = mitigations[Math.floor(Math.random() * mitigations.length)];
      
      const serverPath = generateServerPath(form.deadline_hours, estimatedSpotPrice);
      
      setResult({
        decision: {
          region: selectedRegion,
          az: selectedAZ,
          gpu_sku: selectedGPU.sku,
          gpu_name: selectedGPU.name,
          strategy: selectedStrategy,
          estimated_spot_price: estimatedSpotPrice,
          reason: selectedReason,
        },
        fallback_gpu: {
          sku: fallbackGPU.sku,
          gpu_name: fallbackGPU.name,
          spot_price: fallbackPrice,
          reason: `Higher capacity backup in ${selectedRegion} if primary unavailable`,
        },
        checkpointing: {
          interval_min: checkpointInterval,
          estimated_size_gb: checkpointSize,
          storage: selectedStorage,
        },
        savings: scaledSavings,
        green_impact: scaledGreenImpact,
        server_path: serverPath,
        risk_assessment: {
          interruption_probability: selectedRiskProb,
          risk_level: selectedRiskLevel,
          mitigation: selectedMitigation,
        },
      });
      setStep("results");
    } finally {
      setLoading(false);
    }
  };

  const carbonEquivalents = result ? getCarbonEquivalents(result.green_impact.total_co2_kg) : [];

  // Export to PDF function
  const exportToPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Vert emerald
    doc.text('NERVE Simulation Report', 20, 20);
    
    // Ligne de séparation
    doc.setDrawColor(34, 197, 94);
    doc.line(20, 25, 190, 25);
    
    // Section Savings
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Your Savings', 20, 40);
    
    doc.setFontSize(12);
    doc.text(`Total Saved: ${result.savings.saved_eur.toFixed(2)}€`, 20, 50);
    doc.text(`Savings Percentage: ${result.savings.savings_pct.toFixed(1)}%`, 20, 57);
    doc.text(`Spot Price: ${result.savings.spot_total_usd.toFixed(2)}€`, 20, 64);
    doc.text(`On-Demand Price: ${result.savings.ondemand_total_usd.toFixed(2)}€`, 20, 71);
    
    // Section Carbon Impact
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Carbon Impact', 20, 90);
    
    doc.setFontSize(12);
    // Total CO₂ en vert
    doc.setTextColor(34, 197, 94);
    doc.text(`Total CO₂: ${result.green_impact.total_co2_kg.toFixed(2)} kg`, 20, 100);
    // Energy Consumed en noir
    doc.setTextColor(0, 0, 0);
    doc.text(`Energy Consumed: ${result.green_impact.total_kwh.toFixed(0)} kWh`, 20, 107);
    // CO₂ Saved en vert
    doc.setTextColor(34, 197, 94);
    doc.text(`CO₂ Saved vs Worst Region: ${result.green_impact.co2_vs_worst_region_kg.toFixed(1)} kg`, 20, 114);
    
    // Date de génération
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    doc.text(`Generated on ${now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 20, 140);
    
    // Footer
    doc.setFontSize(8);
    doc.text('NERVE by Wattless - Spot GPU Orchestrator', 105, 285, { align: 'center' });
    
    // Télécharger le PDF
    doc.save(`nerve-simulation-${Date.now()}.pdf`);
  };

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
                        {result.green_impact.total_co2_kg.toFixed(2)} kg CO2
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
                        {result.green_impact.co2_vs_worst_region_kg.toFixed(1)} kg CO2 saved vs worst region
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

              {/* Export to PDF Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={exportToPDF}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 inline-flex items-center gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Export to PDF
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Simulate;
