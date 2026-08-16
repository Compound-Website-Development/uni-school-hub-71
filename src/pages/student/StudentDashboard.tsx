import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { naira } from "@/lib/finance";
import {
  BookOpen, FileText, Calendar, TrendingUp, Award, Clock, ChevronRight,
  ClipboardList, CreditCard, CalendarDays, Megaphone, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Grade {
  id: string;
  total_score: number | null;
  letter_grade: string | null;
  subjects: { name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { name: string } | null;
}

interface ClassSlot {
  id: string;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  teacher_name: string;
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const StudentDashboard = () => {
  const { studentData, isShadowIdentity } = useAuth();
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [termResult, setTermResult] = useState<TermResult | null>(null);
  const [todayClasses, setTodayClasses] = useState<ClassSlot[]>([]);
  const [attendance, setAttendance] = useState<{ status: string }[]>([]);
  const [pendingHomework, setPendingHomework] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<{ title: string; content: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    const load = async () => {
      if (!studentData?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const currentDay = new Date().getDay();
        const [gradesRes, resultRes, attRes, annRes, invRes] = await Promise.all([
          supabase
            .from("grades")
            .select("id, total_score, letter_grade, subjects (name)")
            .eq("student_id", studentData.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("term_results")
            .select("gpa, class_position, class_size, terms (name)")
            .eq("student_id", studentData.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("attendance")
            .select("status")
            .eq("student_id", studentData.id)
            .order("date", { ascending: false })
            .limit(90),
          supabase
            .from("announcements")
            .select("title, content")
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("invoices")
            .select("total, amount_paid")
            .eq("student_id", studentData.id),
        ]);

        setRecentGrades((gradesRes.data as any) || []);
        if (resultRes.data) setTermResult(resultRes.data as any);
        setAttendance((attRes.data as any) || []);
        setAnnouncement((annRes.data as any) || null);
        setBalance(
          ((invRes.data as any[]) || []).reduce(
            (sum, i) => sum + (Number(i.total || 0) - Number(i.amount_paid || 0)),
            0,
          ),
        );

        if (studentData.class_id) {
          const [schedRes, hwRes] = await Promise.all([
            supabase
              .from("schedules")
              .select("id, start_time, end_time, room, subjects (name), teachers (first_name, last_name)")
              .eq("class_id", studentData.class_id)
              .eq("day_of_week", currentDay)
              .order("start_time"),
            supabase
              .from("assignments")
              .select("id", { count: "exact", head: true })
              .eq("class_id", studentData.class_id)
              .gte("due_date", new Date().toISOString()),
          ]);
          setTodayClasses(
            ((schedRes.data as any[]) || []).map((s: any) => ({
              id: s.id,
              start_time: s.start_time?.slice(0, 5) || "09:00",
              end_time: s.end_time?.slice(0, 5) || "10:00",
              room: s.room,
              subject_name: s.subjects?.name || "Subject",
              teacher_name: s.teachers ? `${s.teachers.first_name} ${s.teachers.last_name}` : "TBA",
            })),
          );
          setPendingHomework(hwRes.count || 0);
        }
      } catch (error) {
        console.error("Error loading student dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentData?.id, studentData?.class_id]);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nextClass = todayClasses.find((c) => toMinutes(c.start_time) > nowMinutes);
  const minutesToNext = nextClass ? toMinutes(nextClass.start_time) - nowMinutes : null;

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : null;

  const average = recentGrades.length
    ? Math.round(recentGrades.reduce((s, g) => s + Number(g.total_score || 0), 0) / recentGrades.length)
    : null;

  const quickActions = [
    { icon: BookOpen, label: "Results", href: "/student/grades", color: "bg-primary/10 text-primary" },
    { icon: FileText, label: "Report Card", href: "/student/report-card", color: "bg-success/10 text-success" },
    { icon: ClipboardList, label: "Homework", href: "/student/homework", color: "bg-accent/15 text-accent-foreground" },
    { icon: CalendarDays, label: "Schedule", href: "/student/schedule", color: "bg-info/10 text-info" },
    { icon: BookOpen, label: "Learning Hub", href: "/student/learning", color: "bg-primary/10 text-primary" },
    { icon: CreditCard, label: "Fees", href: "/student/fees", color: "bg-warning/10 text-warning" },
    { icon: Calendar, label: "Attendance", href: "/student/attendance", color: "bg-success/10 text-success" },
    { icon: Megaphone, label: "News", href: "/student/announcements", color: "bg-accent/15 text-accent-foreground" },
  ];

  const gradeColor = (grade: string | null) => {
    switch (grade) {
      case "A": return "text-success bg-success/10";
      case "B": return "text-primary bg-primary/10";
      case "C": return "text-warning bg-warning/10";
      default: return "text-destructive bg-destructive/10";
    }
  };

  const stats = [
    {
      label: "Attendance",
      value: attendanceRate !== null ? `${attendanceRate}%` : "—",
      icon: CheckCircle2,
      hint: attendance.length ? `${presentCount}/${attendance.length} days present` : "No records yet",
      progress: attendanceRate ?? 0,
    },
    {
      label: "Term Average",
      value: average !== null ? `${average}%` : "—",
      icon: TrendingUp,
      hint: recentGrades.length ? `Across ${recentGrades.length} recent subjects` : "Awaiting scores",
      progress: average ?? 0,
    },
    {
      label: "Class Position",
      value: termResult?.class_position ? `${termResult.class_position}` : "—",
      icon: Award,
      hint: termResult?.class_size ? `Out of ${termResult.class_size} pupils` : "Not published yet",
      progress: null,
    },
    {
      label: "Fee Balance",
      value: naira(balance),
      icon: CreditCard,
      hint: balance > 0 ? "Payment outstanding" : "Fully paid — thank you",
      progress: null,
    },
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="space-y-6">
        {isShadowIdentity && (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 animate-fade-up">
            <ShieldCheck className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Admin preview identity</p>
              <p className="text-muted-foreground">
                You are signed in as an administrator viewing the student portal through a sample pupil record. Your
                account is not a real pupil.
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <Card className="rounded-3xl border-0 bg-primary text-primary-foreground shadow-lg overflow-hidden animate-fade-up">
          <CardContent className="p-6 relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
            <div className="absolute right-10 bottom--6 w-24 h-24 rounded-full bg-primary-foreground/5" />
            <p className="text-xs font-medium opacity-80">{getGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              {studentData?.first_name || "Student"} 👋
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {studentData?.student_id && (
                <Badge className="bg-primary-foreground/15 text-primary-foreground border-0">
                  {studentData.student_id}
                </Badge>
              )}
              <Badge className="bg-accent text-accent-foreground border-0">
                {termResult?.terms?.name || "Current term"}
              </Badge>
            </div>

            <div className="mt-5 rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
                {nextClass ? "Next class in" : "Today"}
              </p>
              {nextClass ? (
                <div className="flex items-end justify-between gap-3 mt-1">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">
                      {String(Math.floor((minutesToNext || 0) / 60)).padStart(2, "0")}:
                      {String((minutesToNext || 0) % 60).padStart(2, "0")}
                    </p>
                    <p className="font-semibold mt-1">{nextClass.subject_name}</p>
                    <p className="text-sm opacity-80">
                      {nextClass.teacher_name}
                      {nextClass.room ? ` • ${nextClass.room}` : ""}
                    </p>
                  </div>
                  <Link to="/student/schedule">
                    <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-md">
                      Timetable
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-sm mt-1 opacity-90">
                  {todayClasses.length
                    ? "All classes for today are done. Well done!"
                    : "No classes scheduled for today."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up animation-delay-100">
          {loading
            ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : stats.map((s) => (
                <Card key={s.label} className="rounded-2xl shadow-card hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                      <div className="p-1.5 rounded-lg bg-muted">
                        <s.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground mt-2 truncate">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.hint}</p>
                    {s.progress !== null && <Progress value={s.progress} className="h-1.5 mt-2" />}
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Quick actions */}
        <div className="animate-fade-up animation-delay-200">
          <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href + action.label} to={action.href}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className={cn("p-3 rounded-xl", action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's schedule */}
          <div className="animate-fade-up animation-delay-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Today's Classes
              </h2>
              <Link to="/student/schedule">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-0 divide-y divide-border">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : todayClasses.length ? (
                  todayClasses.map((cls) => {
                    const isNow =
                      toMinutes(cls.start_time) <= nowMinutes && toMinutes(cls.end_time) > nowMinutes;
                    return (
                      <div key={cls.id} className="flex items-center gap-4 p-4">
                        <div className="w-14 shrink-0 text-center">
                          <p className="text-sm font-bold text-foreground tabular-nums">{cls.start_time}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{cls.end_time}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{cls.subject_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {cls.teacher_name}
                            {cls.room ? ` • ${cls.room}` : ""}
                          </p>
                        </div>
                        {isNow && (
                          <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">Now</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No classes scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent grades */}
          <div className="animate-fade-up animation-delay-400">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Recent Results
              </h2>
              <Link to="/student/grades">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-0 divide-y divide-border">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : recentGrades.length ? (
                  recentGrades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{grade.subjects?.name || "Subject"}</p>
                          <p className="text-sm text-muted-foreground">{grade.total_score ?? 0}%</p>
                        </div>
                      </div>
                      <span className={cn("px-3 py-1.5 rounded-xl text-sm font-bold", gradeColor(grade.letter_grade))}>
                        {grade.letter_grade || "N/A"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No results published yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Homework + announcement */}
        <div className="grid md:grid-cols-2 gap-4 animate-fade-up animation-delay-400">
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{pendingHomework}</p>
                <p className="text-sm text-muted-foreground">Assignments due soon</p>
              </div>
              <Link to="/student/homework">
                <Button variant="outline" size="sm" className="shadow-sm">Open</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Megaphone className="w-4 h-4 text-accent-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest notice</p>
              </div>
              {announcement ? (
                <>
                  <p className="font-semibold text-foreground">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{announcement.content}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No announcements yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
