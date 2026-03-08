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
  UserPlus, TrendingUp, TrendingDown, BarChart2, Activity,
  Clock, CheckCircle, AlertCircle, ArrowRight
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalRevenue: number;
  pendingApprovals: number;
  totalClasses: number;
  activeApplications: number;
  attendanceRate: number;
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
        const [studentsRes, teachersRes, classesRes, appsRes, gradesRes, announcementsRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("teachers").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("classes").select("id", { count: "exact", head: true }),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("grades").select("id", { count: "exact", head: true }).eq("status", "draft"),
          supabase.from("announcements").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          totalStudents: studentsRes.count || 0,
          totalStaff: teachersRes.count || 0,
          totalClasses: classesRes.count || 0,
          activeApplications: appsRes.count || 0,
          pendingApprovals: appsRes.count || 0,
          totalRevenue: 0,
          attendanceRate: 92,
          announcementsSent: announcementsRes.count || 0,
        });

        // Fetch recent activity
        const { data: activityData } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(8);

        setRecentActivity(activityData || []);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { icon: GraduationCap, label: "Total Students", value: stats?.totalStudents || 0, color: "text-primary", bg: "bg-primary/10", trend: "+12%", trendUp: true },
    { icon: Briefcase, label: "Total Staff", value: stats?.totalStaff || 0, color: "text-info", bg: "bg-info/10", trend: "+3%", trendUp: true },
    { icon: CreditCard, label: "Revenue", value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`, color: "text-success", bg: "bg-success/10", trend: "+8%", trendUp: true },
    { icon: UserPlus, label: "Pending Approvals", value: stats?.pendingApprovals || 0, color: "text-warning", bg: "bg-warning/10", trend: "", trendUp: false },
  ];

  const secondaryStats = [
    { label: "Announcements", value: stats?.announcementsSent || 0, icon: Megaphone, color: "text-accent" },
    { label: "Total Classes", value: stats?.totalClasses || 0, icon: BarChart2, color: "text-info" },
    { label: "Attendance Rate", value: `${stats?.attendanceRate || 0}%`, icon: CheckCircle, color: "text-success" },
    { label: "Active Applications", value: stats?.activeApplications || 0, icon: Activity, color: "text-primary" },
  ];

  const quickActions = [
    { icon: GraduationCap, label: "Manage Students", href: "/admin/students", color: "bg-primary/10 text-primary" },
    { icon: Briefcase, label: "Manage Staff", href: "/admin/staff", color: "bg-info/10 text-info" },
    { icon: UserPlus, label: "Admissions", href: "/admin/admissions", color: "bg-warning/10 text-warning" },
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements", color: "bg-accent/10 text-accent" },
    { icon: CreditCard, label: "Fee Management", href: "/admin/fees", color: "bg-success/10 text-success" },
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
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Welcome back, {userName} 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening across your school today.</p>
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
                    {card.trend && (
                      <Badge variant="outline" className={`text-[10px] ${card.trendUp ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}`}>
                        {card.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {card.trend}
                      </Badge>
                    )}
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
          {/* Quick Actions */}
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

          {/* Recent Activity */}
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
                          {log.entity_type && <span className="capitalize">{log.entity_type}</span>}
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
