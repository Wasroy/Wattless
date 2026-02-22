import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Leaf,
  Shield,
  Activity,
  ArrowUpRight,
  MapPin,
  Wind,
  Thermometer,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { api, type DashboardStats, type RegionSummary, type PriceCurvePoint } from "@/lib/api";

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [curve, setCurve] = useState<PriceCurvePoint[]>([]);

  useEffect(() => {
    const load = () => {
      api.dashboardStats().then(setStats).catch(() => {});
      api.regionsSummary().then(setRegions).catch(() => {});
      api.priceCurve("francecentral").then(setCurve).catch(() => {});
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const carbonColor = (v: number) =>
    v < 100 ? "text-green-600" : v < 250 ? "text-amber-600" : "text-red-500";
  const carbonDot = (v: number) =>
    v < 100 ? "bg-green-500" : v < 250 ? "bg-amber-500" : "bg-red-500";

  const kpis = stats
    ? [
        {
          title: "Total Savings",
          value: `$${stats.total_savings_usd.toFixed(2)}`,
          sub: `${stats.total_savings_eur.toFixed(2)} EUR · avg ${stats.avg_savings_pct.toFixed(0)}%`,
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          title: "CO2 Saved",
          value: `${(stats.total_co2_saved_grams / 1000).toFixed(2)} kg`,
          sub: "GreenOps impact",
          icon: Leaf,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          title: "Checkpoints",
          value: `${stats.total_checkpoints_saved}`,
          sub: `${stats.total_evictions_handled} evictions handled`,
          icon: Shield,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          title: "Uptime",
          value: `${stats.uptime_pct.toFixed(2)}%`,
          sub: `${stats.total_jobs_managed} jobs · ${stats.regions_monitored.length} regions`,
          icon: Activity,
          color: "text-violet-600",
          bg: "bg-violet-50",
        },
      ]
    : [];

  const chartConfig = {
    spot_price: { label: "Spot Price", color: "hsl(142, 72%, 42%)" },
    ondemand_price: { label: "On-Demand", color: "hsl(0, 84%, 60%)" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Badge variant="outline" className="text-xs font-mono">
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Real-time FinOps & GreenOps monitoring — live data from Azure,
            Open-Meteo, Carbon Intensity UK
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {kpi.title}
                      </p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpi.sub}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${kpi.bg}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!stats && (
            <div className="col-span-4 text-center text-sm text-muted-foreground py-8">
              Connecting to NERVE backend...
            </div>
          )}
        </div>

        {/* Price Chart + Region Cards */}
        <div className="grid gap-4 lg:grid-cols-3 mb-8">
          {/* Price Curve */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Spot Price Curve (24h)
                </CardTitle>
                <CardDescription>
                  France Central — on-demand reference in red
                </CardDescription>
              </CardHeader>
              <CardContent>
                {curve.length > 0 ? (
                  <ChartContainer config={chartConfig}>
                    <AreaChart data={curve}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(220 13% 91%)"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        stroke="hsl(220 10% 46%)"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="hsl(220 10% 46%)"
                        tickFormatter={(v) => `$${v}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="spot_price"
                        stroke="hsl(142, 72%, 42%)"
                        fill="hsl(142, 72%, 42%)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="ondemand_price"
                        stroke="hsl(0, 84%, 60%)"
                        fill="transparent"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                      />
                      {curve.find((c) => c.is_current) && (
                        <ReferenceLine
                          x={curve.find((c) => c.is_current)?.label}
                          stroke="hsl(220 10% 46%)"
                          strokeDasharray="3 3"
                          label={{ value: "Now", position: "top", fontSize: 10 }}
                        />
                      )}
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    Loading price data...
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Region Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            {regions.map((r) => (
              <Card key={r.region_id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-sm">{r.location}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${carbonColor(
                        r.carbon_gco2_kwh
                      )}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${carbonDot(
                          r.carbon_gco2_kwh
                        )}`}
                      />
                      {r.carbon_gco2_kwh.toFixed(0)} gCO2
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      {r.temperature_c.toFixed(1)}°C
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      {r.wind_kmh.toFixed(0)} km/h
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {r.gpu_count} GPUs
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Cheapest: {r.cheapest_gpu_name}
                    </span>
                    <span className="font-mono text-xs font-semibold text-green-600">
                      ${r.cheapest_spot_price.toFixed(3)}/h
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {regions.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Loading regions...
              </div>
            )}
          </motion.div>
        </div>

        {/* Region Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Region Overview</CardTitle>
                  <CardDescription>
                    Live data refreshed every 15s
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {regions.length} regions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Region</th>
                    <th className="pb-3 font-medium">Location</th>
                    <th className="pb-3 font-medium">Weather</th>
                    <th className="pb-3 font-medium">Carbon</th>
                    <th className="pb-3 font-medium">Cheapest Spot</th>
                    <th className="pb-3 font-medium">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {regions.map((r) => (
                    <tr
                      key={r.region_id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 font-mono text-xs">
                        {r.region_id}
                      </td>
                      <td className="py-3">{r.location}</td>
                      <td className="py-3 text-xs">
                        {r.temperature_c.toFixed(1)}°C ·{" "}
                        {r.wind_kmh.toFixed(0)} km/h
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 ${carbonColor(
                            r.carbon_gco2_kwh
                          )} text-xs font-medium`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${carbonDot(
                              r.carbon_gco2_kwh
                            )}`}
                          />
                          {r.carbon_gco2_kwh.toFixed(0)} gCO2
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs">
                        ${r.cheapest_spot_price.toFixed(3)}/h (
                        {r.cheapest_gpu_name})
                      </td>
                      <td className="py-3 font-semibold text-green-600">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {r.cheapest_savings_pct.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                  {regions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground text-xs"
                      >
                        Loading live data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
