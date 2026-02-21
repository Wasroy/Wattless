import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Mock data
  const savingsData = [
    { date: "Lun", savings: 1200, target: 1500 },
    { date: "Mar", savings: 1800, target: 1500 },
    { date: "Mer", savings: 1500, target: 1500 },
    { date: "Jeu", savings: 2200, target: 1500 },
    { date: "Ven", savings: 1900, target: 1500 },
    { date: "Sam", savings: 2400, target: 1500 },
    { date: "Dim", savings: 2100, target: 1500 },
  ];

  const costBreakdown = [
    { category: "Compute", cost: 45000, savings: 12847 },
    { category: "Storage", cost: 12000, savings: 3200 },
    { category: "Network", cost: 8000, savings: 2100 },
    { category: "Database", cost: 15000, savings: 4500 },
  ];

  const uptimeData = [
    { time: "00:00", uptime: 99.8 },
    { time: "04:00", uptime: 99.9 },
    { time: "08:00", uptime: 99.7 },
    { time: "12:00", uptime: 99.95 },
    { time: "16:00", uptime: 99.9 },
    { time: "20:00", uptime: 99.85 },
    { time: "24:00", uptime: 99.92 },
  ];

  const recentJobs = [
    { id: "job-001", name: "Data Processing Pipeline", status: "success", savings: 450, time: "2 min ago" },
    { id: "job-002", name: "ML Training Job", status: "success", savings: 1200, time: "15 min ago" },
    { id: "job-003", name: "Batch Analytics", status: "running", savings: 0, time: "Now" },
    { id: "job-004", name: "ETL Process", status: "success", savings: 890, time: "1h ago" },
    { id: "job-005", name: "Report Generation", status: "success", savings: 320, time: "2h ago" },
  ];

  const chartConfig = {
    savings: {
      label: "Économies",
      color: "hsl(142, 72%, 50%)",
    },
    target: {
      label: "Objectif",
      color: "hsl(215, 12%, 50%)",
    },
    uptime: {
      label: "Uptime",
      color: "hsl(142, 72%, 50%)",
    },
  };

  const stats = [
    {
      title: "Économisé ce mois",
      value: "$12,847",
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      description: "vs mois dernier",
    },
    {
      title: "Interruptions évitées",
      value: "142",
      change: "100%",
      trend: "up",
      icon: CheckCircle2,
      description: "Aucune interruption",
    },
    {
      title: "Uptime des jobs",
      value: "99.97%",
      change: "stable",
      trend: "stable",
      icon: Activity,
      description: "7 derniers jours",
    },
    {
      title: "Jobs optimisés",
      value: "1,247",
      change: "+156",
      trend: "up",
      icon: Zap,
      description: "Ce mois",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard FinOps</h1>
          <p className="text-muted-foreground">
            Visualisez vos économies et performances en temps réel
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {stat.trend === "up" && <ArrowUpRight className="h-3 w-3 text-primary" />}
                    {stat.trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                    {stat.trend === "stable" && <Clock className="h-3 w-3 text-muted-foreground" />}
                    <span className={stat.trend === "up" ? "text-primary" : stat.trend === "down" ? "text-destructive" : ""}>
                      {stat.change}
                    </span>
                    <span className="ml-1">{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Savings Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Économies quotidiennes</CardTitle>
                    <CardDescription>Évolution sur 7 jours</CardDescription>
                  </div>
                  <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d")}>
                    <TabsList className="h-8">
                      <TabsTrigger value="7d" className="text-xs">7j</TabsTrigger>
                      <TabsTrigger value="30d" className="text-xs">30j</TabsTrigger>
                      <TabsTrigger value="90d" className="text-xs">90j</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={savingsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="var(--color-savings)"
                      fill="var(--color-savings)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="var(--color-target)"
                      fill="var(--color-target)"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Uptime Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Uptime des jobs</CardTitle>
                <CardDescription>Performance sur 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart data={uptimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis domain={[99.5, 100]} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="uptime"
                      stroke="var(--color-uptime)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Cost Breakdown and Recent Jobs */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {/* Cost Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Répartition des coûts</CardTitle>
                <CardDescription>Économies par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <BarChart data={costBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="category" type="category" className="text-xs" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cost" fill="var(--color-target)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="savings" fill="var(--color-savings)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Jobs récents</CardTitle>
                <CardDescription>Activité des dernières heures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        {job.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                        {job.status === "running" && (
                          <Activity className="h-4 w-4 text-primary animate-pulse" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{job.name}</div>
                          <div className="text-xs text-muted-foreground">{job.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.savings > 0 && (
                          <Badge variant="outline" className="text-primary border-primary">
                            ${job.savings}
                          </Badge>
                        )}
                        <Badge
                          variant={job.status === "success" ? "default" : "secondary"}
                        >
                          {job.status === "success" ? "Réussi" : "En cours"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Alertes et recommandations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Optimisation disponible</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      3 jobs peuvent être optimisés pour économiser ~$2,400/mois
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/50">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Tout fonctionne correctement</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Aucune interruption détectée cette semaine
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
