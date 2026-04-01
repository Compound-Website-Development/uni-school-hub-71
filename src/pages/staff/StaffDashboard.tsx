import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, UserPlus, Users, ClipboardCheck, Clock, Eye,
  Users as UsersIcon, BookOpen, AlertTriangle, BarChart2,
  CheckCircle, TrendingUp
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  pendingGrades: number;
  newApplications: number;
}

interface UpcomingClass {
  time: string;
  className: string;
  subject: string;
  students: number;
}

interface PerformanceMetrics {
  classesTeaching: number;
  attendanceMarked: number;
  gradesEntered: number;
  lessonPlansCreated: number;
}

const StaffDashboard = () => {
  const { teacherData, userRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = teacherData 
    ? `${teacherData.first_name} ${teacherData.last_name}`
    : "Staff Member";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [studentsRes, classesRes, gradesRes, applicationsRes] = await Promise.all([
          supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("classes").select("id", { count: "exact", head: true }),
          supabase.from("grades").select("id", { count: "exact", head: true }).eq("status", "draft"),
          supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        setStats({
          totalStudents: studentsRes.count || 0,
          totalClasses: classesRes.count || 0,
          pendingGrades: gradesRes.count || 0,
          newApplications: applicationsRes.count || 0,
        });

        // Fetch staff performance metrics
        if (teacherData?.id) {
          const [classSubjectsRes, attendanceRes, gradesEnteredRes, lessonPlansRes] = await Promise.all([
            supabase.from("class_subjects").select("id", { count: "exact", head: true }).eq("teacher_id", teacherData.id),
            supabase.from("attendance").select("id", { count: "exact", head: true }).eq("marked_by", teacherData.id),
            supabase.from("grades").select("id", { count: "exact", head: true }).eq("entered_by", teacherData.id),
            supabase.from("lesson_plans").select("id", { count: "exact", head: true }).eq("teacher_id", teacherData.id),
          ]);

          setPerformance({
            classesTeaching: classSubjectsRes.count || 0,
            attendanceMarked: attendanceRes.count || 0,
            gradesEntered: gradesEnteredRes.count || 0,
            lessonPlansCreated: lessonPlansRes.count || 0,
          });
        }

        const dayOfWeek = new Date().getDay();
        const { data: scheduleData } = await supabase
          .from("schedules")
          .select(`start_time, end_time, room, classes (name), subjects (name)`)
          .eq("day_of_week", dayOfWeek)
          .order("start_time")
          .limit(5);

        if (scheduleData && scheduleData.length > 0) {
          setUpcomingClasses(
            scheduleData.map((s: any) => ({
              time: s.start_time?.slice(0, 5) || "09:00",
              className: s.classes?.name || "Unknown",
              subject: s.subjects?.name || "Unknown",
              students: 30,
            }))
          );
        } else {
          setUpcomingClasses([
            { time: "09:00", className: "Grade 10A", subject: "Mathematics", students: 32 },
            { time: "11:00", className: "Grade 11B", subject: "Mathematics", students: 28 },
            { time: "14:00", className: "Grade 12A", subject: "Additional Math", students: 24 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [teacherData?.id]);

  if (isLoading) {
    return (
      <StaffLayout title="Dashboard">
        <DashboardSkeleton />
      </StaffLayout>
    );
  }

  const quickActions = [
    { icon: FileText, label: "Upload Grades", href: "/staff/gradebook", color: "text-primary bg-primary/10" },
    { icon: UserPlus, label: "Admissions", href: "/staff/admissions", color: "text-success bg-success/10" },
    { icon: Users, label: "Students", href: "/staff/students", color: "text-warning bg-warning/10" },
    { icon: ClipboardCheck, label: "Attendance", href: "/staff/attendance", color: "text-info bg-info/10" },
  ];

  const pendingTasks = [
    { task: "Upload Term 3 grades", due: "Due in 2 days", priority: "high" as const },
    { task: `Review ${stats?.newApplications || 0} applications`, due: "Due in 5 days", priority: "medium" as const },
    { task: "Generate class reports", due: "Due in 7 days", priority: "low" as const },
  ];

  const performanceItems = performance ? [
    { label: "Classes Teaching", value: performance.classesTeaching, icon: BookOpen, color: "text-primary" },
    { label: "Attendance Marked", value: performance.attendanceMarked, icon: ClipboardCheck, color: "text-success" },
    { label: "Grades Entered", value: performance.gradesEntered, icon: FileText, color: "text-info" },
    { label: "Lesson Plans", value: performance.lessonPlansCreated, icon: BarChart2, color: "text-warning" },
  ] : [];

  return (
    <StaffLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Good Morning, {userName.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{currentDate}</span> • You have {upcomingClasses.length} classes today
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/staff/gradebook">
              <Button className="bg-gradient-primary">
                <FileText className="w-4 h-4 mr-2" />
                Upload Grades
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="group" label="Total Students" value={stats?.totalStudents?.toString() || "0"} variant="primary" />
          <StatCard icon="book" label="Classes" value={stats?.totalClasses?.toString() || "0"} variant="success" />
          <StatCard icon="assignment" label="Pending Grades" value={stats?.pendingGrades?.toString() || "0"} variant="warning" />
          <StatCard icon="person_add" label="New Applications" value={stats?.newApplications?.toString() || "0"} variant="destructive" />
        </div>

        {/* Performance Metrics */}
        {performance && (
          <Card className="border-border/50 rounded-xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> My Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {performanceItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="p-2 rounded-lg bg-background">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">{item.value}</p>
                        <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} to={action.href}>
                <Card className="p-4 card-hover-subtle cursor-pointer group rounded-xl border-border/50 shadow-card">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 rounded-xl border-border/50 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      idx === 0 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-sm font-medium">{cls.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{cls.className} - {cls.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        {cls.students} students
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.priority === "high" ? "bg-destructive" :
                      item.priority === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground">{item.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
