import { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Code,
  Clock,
  Zap,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callEdgeFunction } from "@/lib/supabase";
import { toast } from "sonner";

interface TestResult {
  functionName: string;
  status: "idle" | "loading" | "success" | "error";
  data?: any;
  error?: string;
  duration?: number;
  timestamp?: string;
}

const TestEdgeFunctions = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [simulateForm, setSimulateForm] = useState({
    estimated_gpu_hours: "10",
    min_gpu_memory_gb: "16",
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    preferred_region: "all",
    checkpoint_interval_min: "30",
    flexible: true,
  });

  const functions = [
    { id: "scrape-gpu-prices", name: "Scrape GPU Prices", description: "Récupère les prix GPU depuis Azure Retail Prices API", icon: TrendingUp, color: "text-blue-500", needsInput: true, inputLabel: "Region ID", inputPlaceholder: "francecentral, westeurope, uksouth", defaultInput: "francecentral" },
    { id: "scrape-weather", name: "Scrape Weather", description: "Récupère les données météo depuis Open-Meteo", icon: Activity, color: "text-cyan-500", needsInput: true, inputLabel: "Region ID", inputPlaceholder: "francecentral, westeurope, uksouth", defaultInput: "francecentral" },
    { id: "scrape-carbon", name: "Scrape Carbon", description: "Récupère l'intensité carbone (UK API ou modèle physique)", icon: Zap, color: "text-green-500", needsInput: true, inputLabel: "Region ID", inputPlaceholder: "francecentral, westeurope, uksouth", defaultInput: "uksouth" },
    { id: "get-region-data", name: "Get Region Data", description: "Combine tous les scrapers pour une région complète", icon: Activity, color: "text-purple-500", needsInput: true, inputLabel: "Region ID", inputPlaceholder: "francecentral, westeurope, uksouth", defaultInput: "francecentral" },
    { id: "simulate", name: "Simulate", description: "Simulation NERVE complète avec scoring", icon: Zap, color: "text-orange-500", needsInput: false, isComplex: true },
    { id: "timeshift-plan", name: "Time Shift Plan", description: "Calcule le créneau optimal pour un job", icon: Clock, color: "text-indigo-500", needsInput: false, isComplex: true },
    { id: "checkpoint-simulate", name: "Checkpoint Simulate", description: "Simule une interruption Spot et l'évacuation NERVE", icon: AlertCircle, color: "text-red-500", needsInput: false, isComplex: true },
    { id: "dashboard-stats", name: "Dashboard Stats", description: "Récupère les statistiques du dashboard", icon: TrendingUp, color: "text-emerald-500", needsInput: false },
  ];

  const testFunction = async (func: typeof functions[0], inputValue?: string) => {
    const startTime = Date.now();
    setLoading(func.id);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 15));
    }, 200);

    try {
      let body: any = {};
      if (func.id === "scrape-gpu-prices" || func.id === "scrape-weather") {
        body = { region_id: inputValue || func.defaultInput };
      } else if (func.id === "scrape-carbon") {
        const regionId = inputValue || func.defaultInput;
        if (regionId === "uksouth") {
          body = { region_id: regionId };
        } else {
          const weatherData = await callEdgeFunction("scrape-weather", { region_id: regionId });
          body = { region_id: regionId, weather_data: weatherData };
        }
      } else if (func.id === "get-region-data") {
        body = { region_id: inputValue || func.defaultInput };
      } else if (func.id === "simulate") {
        body = { estimated_gpu_hours: parseFloat(simulateForm.estimated_gpu_hours), min_gpu_memory_gb: parseFloat(simulateForm.min_gpu_memory_gb), deadline: new Date(simulateForm.deadline).toISOString(), preferred_region: simulateForm.preferred_region === "all" ? null : simulateForm.preferred_region, checkpoint_interval_min: parseInt(simulateForm.checkpoint_interval_min), flexible: simulateForm.flexible };
      } else if (func.id === "timeshift-plan") {
        body = { estimated_gpu_hours: parseFloat(simulateForm.estimated_gpu_hours), deadline: new Date(simulateForm.deadline).toISOString(), preferred_region: simulateForm.preferred_region === "all" ? null : simulateForm.preferred_region, flexible: simulateForm.flexible };
      } else if (func.id === "checkpoint-simulate") {
        body = { job_id: "test-job-001", current_region: simulateForm.preferred_region === "all" ? "francecentral" : simulateForm.preferred_region, current_az: "fr-central-1", current_sku: "Standard_NC6s_v3", model_size_gb: parseFloat(simulateForm.min_gpu_memory_gb), epoch_progress_pct: 45.5 };
      } else if (func.id === "dashboard-stats") {
        const data = await callEdgeFunction("dashboard-stats", undefined, { method: "GET" });
        const duration = Date.now() - startTime;
        clearInterval(progressInterval);
        setProgress(100);
        setResults((prev) => ({ ...prev, [func.id]: { functionName: func.name, status: "success", data, duration, timestamp: new Date().toISOString() } }));
        setLoading(null);
        toast.success(`${func.name} exécuté avec succès en ${duration}ms !`);
        return;
      }
      const data = await callEdgeFunction(func.id, body);
      const duration = Date.now() - startTime;
      clearInterval(progressInterval);
      setProgress(100);
      setResults((prev) => ({ ...prev, [func.id]: { functionName: func.name, status: "success", data, duration, timestamp: new Date().toISOString() } }));
      toast.success(`${func.name} exécuté avec succès en ${duration}ms !`);
    } catch (error: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setResults((prev) => ({ ...prev, [func.id]: { functionName: func.name, status: "error", error: error.message || "Erreur inconnue", duration: Date.now() - startTime, timestamp: new Date().toISOString() } }));
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(null);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleOptimize = async () => {
    console.log("[NERVE] Démarrage optimisation...");
    const startTime = Date.now();
    setLoading("optimize-job");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 10));
    }, 300);

    try {
      const deadline = new Date(simulateForm.deadline).toISOString();
      const region = simulateForm.preferred_region === "all" ? null : simulateForm.preferred_region;
      console.log("[NERVE] Appel optimize-job:", { estimated_gpu_hours: parseFloat(simulateForm.estimated_gpu_hours), min_gpu_memory_gb: parseFloat(simulateForm.min_gpu_memory_gb), deadline, preferred_region: region });

      const data = await callEdgeFunction("optimize-job", {
        estimated_gpu_hours: parseFloat(simulateForm.estimated_gpu_hours),
        min_gpu_memory_gb: parseFloat(simulateForm.min_gpu_memory_gb),
        deadline,
        preferred_region: region,
      });

      console.log("[NERVE] Réponse optimize-job:", data);
      clearInterval(progressInterval);
      setProgress(100);

      setResults((prev) => ({
        ...prev,
        "optimize-job": {
          functionName: "Optimisation Job",
          status: "success",
          data,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      }));
      toast.success("Optimisation terminée !");
    } catch (error: any) {
      console.error("[NERVE] Erreur optimize-job:", error);
      clearInterval(progressInterval);
      setProgress(0);
      setResults((prev) => ({
        ...prev,
        "optimize-job": {
          functionName: "Optimisation Job",
          status: "error",
          error: error.message,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      }));
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(null);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const opt = results["optimize-job"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Test des Edge Functions Supabase
          </h1>
          <p className="text-muted-foreground">
            Testez toutes les Edge Functions NERVE avec des données réelles
          </p>
        </div>

        <Tabs defaultValue="optimize" className="space-y-6">
          <TabsList>
            <TabsTrigger value="optimize">Optimiser mon Job</TabsTrigger>
            <TabsTrigger value="functions">Fonctions</TabsTrigger>
            <TabsTrigger value="results">Résultats</TabsTrigger>
          </TabsList>

          {/* ── ONGLET OPTIMIZE ── */}
          <TabsContent value="optimize" className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Optimisation Intelligente NERVE
                </CardTitle>
                <CardDescription>
                  Analyse tous les serveurs disponibles et trouve le meilleur choix
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Heures GPU estimées</Label>
                    <Input type="number" value={simulateForm.estimated_gpu_hours} onChange={(e) => setSimulateForm({ ...simulateForm, estimated_gpu_hours: e.target.value })} placeholder="10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mémoire GPU minimale (GB)</Label>
                    <Input type="number" value={simulateForm.min_gpu_memory_gb} onChange={(e) => setSimulateForm({ ...simulateForm, min_gpu_memory_gb: e.target.value })} placeholder="16" />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="datetime-local" value={simulateForm.deadline} onChange={(e) => setSimulateForm({ ...simulateForm, deadline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Région préférée</Label>
                    <Select value={simulateForm.preferred_region} onValueChange={(v) => setSimulateForm({ ...simulateForm, preferred_region: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les régions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        <SelectItem value="francecentral">France Central</SelectItem>
                        <SelectItem value="westeurope">West Europe</SelectItem>
                        <SelectItem value="uksouth">UK South</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleOptimize} disabled={loading === "optimize-job"} size="lg" className="w-full">
                  {loading === "optimize-job" ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analyse en cours...</>
                  ) : (
                    <><Zap className="mr-2 h-5 w-5" />Optimiser mon Job</>
                  )}
                </Button>

                {loading === "optimize-job" && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Analyse des serveurs disponibles...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                )}

                {opt && opt.status === "error" && (
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Erreur</span>
                    </div>
                    <p className="text-sm text-destructive">{opt.error}</p>
                  </div>
                )}

                {opt && opt.status === "success" && opt.data && (
                  <div className="space-y-4 mt-6">
                    <Card className="border-2 border-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">Recommandation</CardTitle>
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            {opt.duration}ms
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm font-medium mb-2">Pourquoi ce choix ?</p>
                          <p className="text-sm text-muted-foreground">{opt.data.reason}</p>
                        </div>

                        {opt.data.switch_reason && (
                          <div className={`p-4 rounded-lg border-2 ${opt.data.should_switch ? "bg-green-500/10 border-green-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
                            <p className="text-sm font-medium mb-1">{opt.data.should_switch ? "Changement recommandé" : "Configuration optimale"}</p>
                            <p className="text-sm">{opt.data.switch_reason}</p>
                          </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Gain Financier
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Coût recommandé:</span>
                                  <span className="font-bold">${opt.data.financial_analysis.recommended_cost_usd}</span>
                                </div>
                                <div className="pt-2 border-t">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Économies vs On-Demand:</span>
                                    <span className="text-lg font-bold text-green-500">${opt.data.financial_analysis.savings_usd}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">({opt.data.financial_analysis.savings_pct}% d'économies)</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                Impact Environnemental
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">CO2 émis:</span>
                                  <span className="font-bold">{opt.data.environmental_impact.recommended_co2_grams}g</span>
                                </div>
                                <p className="text-sm text-emerald-600 font-medium pt-2 border-t">{opt.data.environmental_impact.equivalent}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Détails du Serveur Recommandé</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-3 md:grid-cols-2 text-sm">
                              <div><span className="text-muted-foreground">GPU:</span> <span className="ml-2 font-medium">{opt.data.recommendation.gpu_name}</span></div>
                              <div><span className="text-muted-foreground">Prix Spot:</span> <span className="ml-2 font-medium">${opt.data.recommendation.spot_price_usd_hr}/h</span></div>
                              <div><span className="text-muted-foreground">Région:</span> <span className="ml-2 font-medium">{opt.data.recommendation.region}</span></div>
                              <div><span className="text-muted-foreground">Zone:</span> <span className="ml-2 font-medium">{opt.data.recommendation.az}</span></div>
                              <div><span className="text-muted-foreground">Carbone:</span> <span className="ml-2 font-medium">{opt.data.recommendation.carbon_index} ({opt.data.recommendation.carbon_intensity_gco2_kwh}g/kWh)</span></div>
                              <div><span className="text-muted-foreground">Score NERVE:</span> <span className="ml-2 font-medium">{opt.data.recommendation.score}</span></div>
                            </div>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ONGLET FONCTIONS ── */}
          <TabsContent value="functions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {functions.map((func) => (
                <Card key={func.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <func.icon className={`h-5 w-5 ${func.color}`} />
                      <CardTitle className="text-lg">{func.name}</CardTitle>
                    </div>
                    <CardDescription>{func.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {func.needsInput && (
                      <div className="space-y-2">
                        <Label>{func.inputLabel}</Label>
                        <Input placeholder={func.inputPlaceholder} defaultValue={func.defaultInput} id={`input-${func.id}`} />
                      </div>
                    )}
                    {func.isComplex && <div className="text-sm text-muted-foreground">Utilise les paramètres de l'onglet Simulation</div>}
                    <Button
                      onClick={() => {
                        if (func.needsInput) {
                          const input = document.getElementById(`input-${func.id}`) as HTMLInputElement;
                          testFunction(func, input?.value);
                        } else {
                          testFunction(func);
                        }
                      }}
                      disabled={loading === func.id}
                      className="w-full"
                      variant={func.isComplex ? "outline" : "default"}
                    >
                      {loading === func.id ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />En cours...</>) : (<><Play className="mr-2 h-4 w-4" />Tester</>)}
                    </Button>
                    {loading === func.id && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">{Math.round(progress)}%</p>
                      </div>
                    )}
                    {results[func.id] && (
                      <div className="mt-2">
                        {results[func.id].status === "success" ? (
                          <Badge variant="default" className="w-full justify-center"><CheckCircle2 className="mr-1 h-3 w-3" />Réussi ({results[func.id].duration}ms)</Badge>
                        ) : (
                          <Badge variant="destructive" className="w-full justify-center"><XCircle className="mr-1 h-3 w-3" />Erreur</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── ONGLET RÉSULTATS ── */}
          <TabsContent value="results" className="space-y-4">
            {Object.entries(results).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aucun résultat pour le moment. Testez une fonction.</p>
                </CardContent>
              </Card>
            )}
            {Object.entries(results).map(([funcId, result]) => (
              <Card key={funcId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                      <CardTitle>{result.functionName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />{result.duration}ms</Badge>}
                      {result.timestamp && <span className="text-xs text-muted-foreground">{new Date(result.timestamp).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.status === "success" ? (
                    <div className="rounded-lg bg-muted p-4">
                      <div className="flex items-center gap-2 mb-2"><Code className="h-4 w-4" /><span className="text-sm font-medium">Résultat JSON</span></div>
                      <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-sm font-medium text-destructive">Erreur</span></div>
                      <p className="text-sm text-destructive">{result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TestEdgeFunctions;
