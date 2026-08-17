import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { naira } from "@/lib/finance";
import {
  BookOpen, FileText, Calendar, TrendingUp, Award, ChevronRight,
  ClipboardList, CreditCard, CalendarDays, Megaphone, ShieldCheck,
  CheckCircle2, GraduationCap, Radio, ArrowUpRight,
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

/** Circular progress meter — the dashboard's primary status object. */
const Meter = ({ value, label, sub }: { value: number | null; label: string; sub: string }) => {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[112px] h-[112px] shrink-0">
        <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
          <circle cx="56" cy="56" r={r} fill="none" strokeWidth="9" className="stroke-primary-foreground/20" />
          <circle
            cx="56" cy="56" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
            className="stroke-primary-foreground transition-[stroke-dashoffset] duration-700 ease-out"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="headline text-3xl num">{value === null ? "—" : `${Math.round(pct)}%`}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{label}</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed opacity-90">{sub}</p>
    </div>
  );
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
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
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

  const metrics = [
    {
      label: "Term average",
      value: average !== null ? `${average}` : "—",
      unit: average !== null ? "%" : "",
      icon: TrendingUp,
      hint: recentGrades.length ? `${recentGrades.length} subjects scored` : "Awaiting scores",
    },
    {
      label: "Class position",
      value: termResult?.class_position ? `${termResult.class_position}` : "—",
      unit: termResult?.class_size ? `/${termResult.class_size}` : "",
      icon: Award,
      hint: termResult?.class_size ? "Published ranking" : "Not published yet",
    },
    {
      label: "Homework due",
      value: `${pendingHomework}`,
      unit: "",
      icon: ClipboardList,
      hint: pendingHomework ? "Open assignments" : "Nothing pending",
    },
    {
      label: "Fee balance",
      value: naira(balance),
      unit: "",
      icon: CreditCard,
      hint: balance > 0 ? "Outstanding" : "Fully settled",
    },
  ];

  const quickActions = [
    { icon: FileText, label: "Report card", href: "/student/report-card" },
    { icon: BookOpen, label: "Results", href: "/student/grades" },
    { icon: CalendarDays, label: "Timetable", href: "/student/schedule" },
    { icon: ClipboardList, label: "Homework", href: "/student/homework" },
    { icon: GraduationCap, label: "Learning", href: "/student/learning" },
    { icon: Calendar, label: "Attendance", href: "/student/attendance" },
    { icon: CreditCard, label: "Fees", href: "/student/fees" },
    { icon: Megaphone, label: "News", href: "/student/announcements" },
  ];

  const gradeTone = (grade: string | null) => {
    switch (grade) {
      case "A": return "bg-success/12 text-success";
      case "B": return "bg-primary/12 text-primary";
      case "C": return "bg-warning/15 text-warning";
      default: return "bg-destructive/12 text-destructive";
    }
  };

  return (
    <StudentLayout title="Dashboard">
      <div className="mx-auto w-full max-w-3xl space-y-4 pb-2">
        {isShadowIdentity && (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-foreground">
              <span className="font-semibold">Admin preview identity.</span> You are viewing the pupil portal through a
              sample record — this account is not a real pupil.
            </p>
          </div>
        )}

        {/* App bar / status surface */}
        <section className="relative overflow-hidden rounded-[28px] bg-primary p-5 text-primary-foreground shadow-elev-3 animate-fade-up">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary-foreground/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-primary-foreground/5" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="overline text-primary-foreground/70">{getGreeting()}</p>
              <h1 className="headline mt-1 truncate text-2xl md:text-3xl">
                {studentData?.first_name || "Pupil"} {studentData?.last_name || ""}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                {studentData?.student_id && (
                  <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 num">{studentData.student_id}</span>
                )}
                <span className="rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
                  {termResult?.terms?.name || "Current term"}
                </span>
              </div>
            </div>
            <Link to="/student/profile" className="press rounded-2xl bg-primary-foreground/15 p-2.5 tap-target">
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="relative mt-5 border-t border-primary-foreground/15 pt-5">
            {loading ? (
              <Skeleton className="h-28 rounded-2xl bg-primary-foreground/15" />
            ) : (
              <Meter
                value={attendanceRate}
                label="Present"
                sub={
                  attendance.length
                    ? `${presentCount} of ${attendance.length} school days attended this session. Keep it above 90% for a strong termly record.`
                    : "Attendance will appear here once the class register is marked."
                }
              />
            )}
          </div>
        </section>

        {/* Live / next class strip */}
        <section className="app-card overflow-hidden animate-fade-up animation-delay-100">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="overline">{nextClass ? "Next class" : "Today"}</p>
            <Link to="/student/schedule" className="press text-xs font-semibold text-primary">
              Full timetable
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : nextClass ? (
            <div className="flex items-center gap-4 p-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10">
                <span className="headline num text-lg text-primary">
                  {String(Math.floor((minutesToNext || 0) / 60)).padStart(2, "0")}:
                  {String((minutesToNext || 0) % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-foreground">{nextClass.subject_name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {nextClass.start_time}–{nextClass.end_time} • {nextClass.teacher_name}
                  {nextClass.room ? ` • ${nextClass.room}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              {todayClasses.length ? "All classes for today are complete." : "No classes scheduled for today."}
            </p>
          )}

          {todayClasses.length > 0 && (
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {todayClasses.map((cls) => {
                const isNow = toMinutes(cls.start_time) <= nowMinutes && toMinutes(cls.end_time) > nowMinutes;
                return (
                  <li key={cls.id} className={cn("flex items-center gap-3 px-4 py-3", isNow && "bg-primary/5")}>
                    <div className="w-12 shrink-0 text-right">
                      <p className="num text-sm font-semibold text-foreground">{cls.start_time}</p>
                      <p className="num text-[10px] text-muted-foreground">{cls.end_time}</p>
                    </div>
                    <span className={cn("h-9 w-[3px] shrink-0 rounded-full", isNow ? "bg-primary" : "bg-border")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{cls.subject_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{cls.teacher_name}</p>
                    </div>
                    {isNow && (
                      <span className="flex items-center gap-1 rounded-full bg-success/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
                        <Radio className="h-3 w-3" /> Live
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Metric tiles */}
        <section className="grid grid-cols-2 gap-3 animate-fade-up animation-delay-200 md:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
            : metrics.map((m) => (
                <div key={m.label} className="app-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="overline truncate">{m.label}</p>
                    <m.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="headline mt-2 truncate text-2xl num text-foreground">
                    {m.value}
                    <span className="text-sm font-semibold text-muted-foreground">{m.unit}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.hint}</p>
                </div>
              ))}
        </section>

        {/* Quick actions — app-style tiles */}
        <section className="animate-fade-up animation-delay-300">
          <p className="overline mb-2 px-1">Shortcuts</p>
          <div className="grid grid-cols-4 gap-2.5 md:grid-cols-8">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                to={a.href}
                className="press group flex flex-col items-center gap-2 rounded-2xl bg-card p-3 shadow-elev-1 border border-border/60 hover:border-primary/40"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-center text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Report card call to action */}
        <section className="animate-fade-up animation-delay-400">
          <div className="app-card flex items-center gap-4 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-foreground">Official termly report card</p>
              <p className="text-xs text-muted-foreground">
                School-issued sheet with C.A, exam scores, affective domain and head teacher's remark.
              </p>
            </div>
            <Link to="/student/report-card">
              <Button size="sm" className="press shadow-btn">Open</Button>
            </Link>
          </div>
        </section>

        {/* Recent results */}
        <section className="app-card overflow-hidden animate-fade-up animation-delay-400">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="overline">Recent results</p>
            <Link to="/student/grades" className="press flex items-center text-xs font-semibold text-primary">
              View all <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : recentGrades.length ? (
            <ul className="divide-y divide-border/60">
              {recentGrades.map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {g.subjects?.name || "Subject"}
                  </p>
                  <span className="num text-sm font-semibold text-foreground">{g.total_score ?? "—"}</span>
                  <span className={cn("rounded-lg px-2 py-1 text-[11px] font-bold", gradeTone(g.letter_grade))}>
                    {g.letter_grade || "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-9 w-9 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No results published for this term yet.</p>
            </div>
          )}
        </section>

        {/* Announcement */}
        {announcement && (
          <section className="animate-fade-up animation-delay-400">
            <Link to="/student/announcements" className="press block app-card p-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <p className="overline">From the school office</p>
              </div>
              <p className="mt-2 font-display font-semibold text-foreground">{announcement.title}</p>
              {announcement.content && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{announcement.content}</p>
              )}
            </Link>
          </section>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
