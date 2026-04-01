import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  PieChart, BarChart2, Users, Loader2, Zap, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const COLORS = ["hsl(152, 60%, 42%)", "hsl(38, 85%, 52%)", "hsl(0, 70%, 55%)", "hsl(210, 75%, 55%)"];

const AdminFinancialIntelligence = () => {
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForecasting, setIsForecasting] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [fi, fp, st] = await Promise.all([
        supabase.from("fee_items").select("*"),
        supabase.from("fee_payments").select("*, students(first_name, last_name, student_id), fee_items(name, amount)"),
        supabase.from("students").select("id, first_name, last_name, student_id").eq("status", "active"),
      ]);
      setFeeItems(fi.data || []);
      setPayments(fp.data || []);
      setStudents(st.data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  const metrics = useMemo(() => {
    const totalExpected = feeItems.reduce((s, f) => s + Number(f.amount || 0), 0) * students.length;
    const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount_paid || 0), 0);
    const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount_paid || 0), 0);
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    // Defaulters: students with no paid payments
    const paidStudentIds = new Set(payments.filter(p => p.status === "paid").map(p => p.student_id));
    const defaulters = students.filter(s => !paidStudentIds.has(s.id));

    // Monthly collection trend (mock data based on payment dates)
    const monthlyData: Record<string, number> = {};
    payments.filter(p => p.status === "paid" && p.paid_at).forEach(p => {
      const month = new Date(p.paid_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
      monthlyData[month] = (monthlyData[month] || 0) + Number(p.amount_paid || 0);
    });
    const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));

    // Fee distribution
    const feeDistribution = feeItems.map(f => ({
      name: f.name,
      value: Number(f.amount || 0),
    }));

    // Payment status distribution
    const statusDist = [
      { name: "Paid", value: payments.filter(p => p.status === "paid").length },
      { name: "Pending", value: payments.filter(p => p.status === "pending").length },
      { name: "Overdue", value: payments.filter(p => p.status !== "paid" && p.status !== "pending").length },
    ].filter(d => d.value > 0);

    // Forecast (simple linear projection)
    const avgMonthly = monthlyTrend.length > 0 ? monthlyTrend.reduce((s, m) => s + m.amount, 0) / monthlyTrend.length : 0;
    const forecastedAnnual = avgMonthly * 12;

    return { totalExpected, totalCollected, totalPending, collectionRate, defaulters, monthlyTrend, feeDistribution, statusDist, avgMonthly, forecastedAnnual };
  }, [feeItems, payments, students]);

  const runForecast = async () => {
    setIsForecasting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "report_comment",
            messages: [{ role: "user", content: "Analyze financial data and provide a forecast" }],
            studentData: {
              type: "financial_forecast",
              totalCollected: metrics.totalCollected,
              totalExpected: metrics.totalExpected,
              collectionRate: metrics.collectionRate,
              defaulterCount: metrics.defaulters.length,
              totalStudents: students.length,
              monthlyTrend: metrics.monthlyTrend,
              forecastedAnnual: metrics.forecastedAnnual,
            },
          }),
        }
      );
      const data = await response.json();
      if (data.comment) {
        setAiInsight(data.comment);
        toast.success("AI financial forecast generated");
      } else {
        toast.error(data.error || "Failed to generate forecast");
      }
    } catch {
      toast.error("Failed to connect to AI service");
    } finally {
      setIsForecasting(false);
    }
  };

  if (isLoading) return <AdminLayout title="Financial Intelligence"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;

  return (
    <AdminLayout title="Financial Intelligence">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" /> Financial Intelligence Hub
            </h2>
            <p className="text-sm text-muted-foreground mt-1">AI-powered cash flow analytics, forecasting & defaulter management</p>
          </div>
          <Button onClick={runForecast} disabled={isForecasting} className="gap-2">
            <Zap className="w-4 h-4" /> {isForecasting ? "Forecasting..." : "Run AI Forecast"}
          </Button>
        </div>

        {/* AI Insight */}
        {aiInsight && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Brain className="w-5 h-5 text-primary" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">AI Financial Insight</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{aiInsight}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: "Total Collected", value: `₦${metrics.totalCollected.toLocaleString()}`, color: "text-success", bg: "bg-success/10" },
            { icon: TrendingUp, label: "Collection Rate", value: `${metrics.collectionRate.toFixed(1)}%`, color: "text-primary", bg: "bg-primary/10" },
            { icon: AlertTriangle, label: "Defaulters", value: metrics.defaulters.length.toString(), color: "text-destructive", bg: "bg-destructive/10" },
            { icon: BarChart2, label: "Forecast (Annual)", value: `₦${Math.round(metrics.forecastedAnnual).toLocaleString()}`, color: "text-info", bg: "bg-info/10" },
          ].map((s, i) => (
            <Card key={i} className="border-border/50 stat-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Collection Trend</CardTitle></CardHeader>
            <CardContent>
              {metrics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No payment data for chart</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Payment Status</CardTitle></CardHeader>
            <CardContent>
              {metrics.statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <RPieChart>
                    <Pie data={metrics.statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {metrics.statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">No payment data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Collection Rate Progress */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overall Collection Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collected vs Expected</span>
                <span className="font-bold text-foreground">{metrics.collectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.collectionRate} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₦{metrics.totalCollected.toLocaleString()} collected</span>
                <span>₦{metrics.totalExpected.toLocaleString()} expected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Fee Defaulters ({metrics.defaulters.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {metrics.defaulters.length > 0 ? (
              <div className="space-y-2">
                {metrics.defaulters.slice(0, 15).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-muted-foreground">{s.student_id}</p>
                    </div>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">Unpaid</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No defaulters — all students have paid</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFinancialIntelligence;
