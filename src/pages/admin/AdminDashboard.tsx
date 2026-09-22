import { PortalHeroArt } from "@/components/PortalHeroArt";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, GraduationCap, Briefcase, CreditCard, Megaphone,
  UserPlus, TrendingDown, BarChart2, Activity,
  CheckCircle, ArrowRight, ExternalLink, Download
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalRevenue: number;
  outstanding: number;
  pendingApprovals: number;
  totalClasses: number;
  activeApplications: number;
  attendanceRate: number;
  attendanceRecords: number;
  publishedResults: number;
  announcementsSent: number;
}

const AdminDashboard = () => {
  const { teacherData } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userName = teacherData ? teacherData.first_name : "Admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const since = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const [
          studentsRes, teachersRes, classesRes, appsRes, announcementsRes,
          attendanceRes, receiptsRes, invoicesRes, proofsRes, resultsRes, activityRes,
        ] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("teachers").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("classes").select("id", { count: "exact", head: true }),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("announcements").select("id", { count: "exact", head: true }),
          supabase.from("attendance").select("status").gte("date", since),
          supabase.from("receipts").select("amount"),
          supabase.from("invoices").select("total, amount_paid"),
          supabase.from("payment_proofs").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("term_results").select("id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
        ]);

        const attendanceData = attendanceRes.data || [];
        const presentCount = attendanceData.filter((a: any) => a.status === "present").length;
        const attendanceRate = attendanceData.length > 0 ? Math.round((presentCount / attendanceData.length) * 100) : 0;

        const totalRevenue = (receiptsRes.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        const outstanding = (invoicesRes.data || []).reduce(
          (s: number, i: any) => s + Math.max(0, Number(i.total || 0) - Number(i.amount_paid || 0)),
          0,
        );

        setStats({
          totalStudents: studentsRes.count || 0,
          totalStaff: teachersRes.count || 0,
          totalClasses: classesRes.count || 0,
          activeApplications: appsRes.count || 0,
          pendingApprovals: (proofsRes.count || 0) + (appsRes.count || 0),
          totalRevenue,
          outstanding,
          attendanceRate,
          attendanceRecords: attendanceData.length,
          publishedResults: resultsRes.count || 0,
          announcementsSent: announcementsRes.count || 0,
        });

        setRecentActivity(activityRes.data || []);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openPortal = (path: string) => {
    window.open(window.location.origin + path, "_blank");
  };

  const money = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  const statCards = [
    { icon: GraduationCap, label: "Active Students", value: String(stats?.totalStudents ?? 0), color: "text-primary", bg: "bg-primary/10" },
    { icon: Briefcase, label: "Active Staff", value: String(stats?.totalStaff ?? 0), color: "text-info", bg: "bg-info/10" },
    { icon: CreditCard, label: "Fees Collected", value: money(stats?.totalRevenue ?? 0), color: "text-success", bg: "bg-success/10" },
    { icon: TrendingDown, label: "Outstanding Balance", value: money(stats?.outstanding ?? 0), color: "text-warning", bg: "bg-warning/10" },
  ];

  const secondaryStats = [
    { label: "Pending Approvals", value: String(stats?.pendingApprovals ?? 0), icon: UserPlus, color: "text-warning" },
    { label: "Total Classes", value: String(stats?.totalClasses ?? 0), icon: BarChart2, color: "text-info" },
    {
      label: stats?.attendanceRecords ? "Attendance (30 days)" : "Attendance — no records yet",
      value: stats?.attendanceRecords ? `${stats.attendanceRate}%` : "—",
      icon: CheckCircle,
      color: "text-success",
    },
    { label: "Published Report Cards", value: String(stats?.publishedResults ?? 0), icon: Activity, color: "text-primary" },
  ];


  const quickActions = [
    { icon: GraduationCap, label: "Manage Students", href: "/admin/students", color: "bg-primary/10 text-primary" },
    { icon: Briefcase, label: "Manage Staff", href: "/admin/staff", color: "bg-info/10 text-info" },
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements", color: "bg-accent/10 text-accent" },
    { icon: CreditCard, label: "Fee Management", href: "/admin/fees", color: "bg-success/10 text-success" },
    { icon: Download, label: "Reports & Export", href: "/admin/reports", color: "bg-warning/10 text-warning" },
    { icon: Activity, label: "Activity Logs", href: "/admin/activity", color: "bg-destructive/10 text-destructive" },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard-surface dashboard-admin space-y-6 animate-fade-in">
        <section className="portal-hero">
          <PortalHeroArt variant="operations" />
          <div className="portal-hero-copy">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Imagemakers command centre</p>
            <h2 className="portal-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Welcome back, {userName}.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">One live view of pupils, staff, attendance, finance, assessments, communication and transport. Empty records stay empty until the school supplies real data.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/admin/cbt" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">Open CBT control</Link>
              <Link to="/admin/transport" className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5">Manage school bus</Link>
            </div>
          </div>
        </section>

        {/* Portal Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50 card-hover-subtle cursor-pointer group" onClick={() => openPortal("/staff")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/10">
                <Briefcase className="w-6 h-6 text-info" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Staff Portal</p>
                <p className="text-xs text-muted-foreground">Open staff dashboard in a new tab</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
          <Card className="border-border/50 card-hover-subtle cursor-pointer group" onClick={() => openPortal("/student")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Student Portal</p>
                <p className="text-xs text-muted-foreground">Open with your admin email — no second device needed</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
          <Card className="border-border/50 card-hover-subtle cursor-pointer group" onClick={() => openPortal("/parent")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/15">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Parent Portal</p>
                <p className="text-xs text-muted-foreground">Preview the parent experience in a new tab</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Card key={idx} className="card-hover-subtle border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-foreground mt-3">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="border-border/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <div>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link key={idx} to={action.href}>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                      <div className={`p-2 rounded-md ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              <Link to="/admin/activity">
                <Button variant="ghost" size="sm" className="text-xs h-7">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                      <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                        <Activity className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.entity && <span className="capitalize">{log.entity}</span>}
                          {" · "}
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent activity yet</p>
                  <p className="text-xs mt-1">Actions performed in the system will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
