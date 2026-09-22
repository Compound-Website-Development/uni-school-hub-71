import { PortalHeroArt } from "@/components/PortalHeroArt";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, CalendarCheck, CalendarDays, ChevronRight, Clock3, CreditCard, FolderOpen, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/student-home-hero.jpg";
import { BookGlyph, GradesGlyph, HomeworkGlyph, ShieldGlyph, TrendGlyph } from "@/components/student/HomeGlyphs";
import { PortalIconArt } from "@/components/PortalIconArt";

interface Grade {
  id: string;
  total_score: number | null;
  letter_grade: string | null;
  created_at?: string | null;
  subjects: { name: string } | null;
}

interface ClassSlot {
  id: string;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  teacher_name: string;
}

interface SchoolMoment {
  id: string;
  title: string;
  date: string | null;
  kind: "event" | "announcement";
}

interface ScannedProfile {
  full_name: string;
  admission_no: string;
  class_name: string | null;
  attendance_present: number;
  attendance_total: number;
}

interface StudentDashboardProps {
  scannedToken?: string;
}

const timeLabel = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hour, minute));
};

const dayLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(d);
};

const StudentDashboard = ({ scannedToken }: StudentDashboardProps) => {
  const { studentData, isShadowIdentity } = useAuth();
  const [scannedProfile, setScannedProfile] = useState<ScannedProfile | null>(null);
  const [scannedAttendanceRate, setScannedAttendanceRate] = useState<number | null>(null);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSlot[]>([]);
  const [attendance, setAttendance] = useState<{ status: string }[]>([]);
  const [pendingHomework, setPendingHomework] = useState(0);
  const [balance, setBalance] = useState(0);
  const [className, setClassName] = useState("");
  const [moments, setMoments] = useState<SchoolMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!studentData?.id && scannedToken) {
        setLoading(true);
        setFailed(false);
        const [{ data: profileRows, error: profileError }, { data: resultRows, error: resultsError }] = await Promise.all([
          supabase.rpc("public_student_profile", { _token: scannedToken }),
          supabase.rpc("public_student_results", { _token: scannedToken }),
        ]);
        if (profileError || resultsError) {
          setFailed(true);
          setLoading(false);
          return;
        }
        const profile = ((profileRows as ScannedProfile[]) || [])[0] || null;
        setScannedProfile(profile);
        setClassName(profile?.class_name || "");
        setScannedAttendanceRate(
          profile && profile.attendance_total > 0
            ? Math.round((profile.attendance_present / profile.attendance_total) * 100)
            : null,
        );
        setRecentGrades(((resultRows as any[]) || []).map((result, index) => ({
          id: `${scannedToken}-${index}`,
          total_score: result.total_score,
          letter_grade: result.letter_grade,
          created_at: null,
          subjects: { name: result.subject || "Subject" },
        })));
        setLoading(false);
        return;
      }
      if (!studentData?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setFailed(false);
      try {
        const currentDay = new Date().getDay();
        const today = new Date().toISOString().slice(0, 10);
        const [gradesRes, attRes, annRes, invRes, eventRes] = await Promise.all([
          supabase.from("grades").select("id, total_score, letter_grade, created_at, subjects (name)").eq("student_id", studentData.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("attendance").select("status").eq("student_id", studentData.id).order("date", { ascending: false }).limit(90),
          supabase.from("announcements").select("id, title, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(2),
          supabase.from("invoices").select("total, amount_paid").eq("student_id", studentData.id),
          supabase.from("school_events").select("id, title, event_date").gte("event_date", today).order("event_date").limit(3),
        ]);
        setRecentGrades((gradesRes.data as Grade[]) || []);
        setAttendance((attRes.data as { status: string }[]) || []);
        setBalance(((invRes.data as { total: number; amount_paid: number }[]) || []).reduce((sum, item) => sum + Number(item.total || 0) - Number(item.amount_paid || 0), 0));

        const events: SchoolMoment[] = ((eventRes.data as any[]) || []).map((e) => ({ id: e.id, title: e.title, date: e.event_date, kind: "event" }));
        const notices: SchoolMoment[] = ((annRes.data as any[]) || []).map((a) => ({ id: a.id, title: a.title, date: a.created_at, kind: "announcement" }));
        setMoments([...events, ...notices].slice(0, 3));

        if (studentData.class_id) {
          const [scheduleRes, homeworkRes, classRes] = await Promise.all([
            supabase.from("schedules").select("id, start_time, end_time, room, subjects (name), teachers (first_name, last_name)").eq("class_id", studentData.class_id).eq("day_of_week", currentDay).order("start_time"),
            supabase.from("assignments").select("id", { count: "exact", head: true }).eq("class_id", studentData.class_id).gte("due_date", new Date().toISOString()),
            supabase.from("classes").select("name").eq("id", studentData.class_id).maybeSingle(),
          ]);
          setTodayClasses(((scheduleRes.data as any[]) || []).map((slot) => ({
            id: slot.id,
            start_time: slot.start_time?.slice(0, 5) || "09:00",
            end_time: slot.end_time?.slice(0, 5) || "10:00",
            room: slot.room,
            subject_name: slot.subjects?.name || "Subject",
            teacher_name: slot.teachers ? `${slot.teachers.first_name} ${slot.teachers.last_name}` : "Teacher",
          })));
          setPendingHomework(homeworkRes.count || 0);
          setClassName((classRes.data as any)?.name || "");
        }
      } catch (error) {
        console.error("Error loading student dashboard:", error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentData?.id, studentData?.class_id, scannedToken, reloadKey]);

  const scannedNames = scannedProfile?.full_name.trim().split(/\s+/) || [];
  const firstName = studentData?.first_name || scannedNames[0] || "Pupil";
  const presentCount = attendance.filter((item) => item.status === "present").length;
  const attendanceRate = scannedToken
    ? scannedAttendanceRate
    : attendance.length
      ? Math.round((presentCount / attendance.length) * 100)
      : null;
  const nextClass = todayClasses[0];
  const todayLabel = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const statusCopy = useMemo(() => {
    if (balance > 0) return `There is an outstanding fee balance on your record. Review it, and keep an eye on your ${pendingHomework} open assignment${pendingHomework === 1 ? "" : "s"}.`;
    if (attendanceRate !== null && attendanceRate >= 90) return `Strong term so far — ${attendanceRate}% attendance, fees settled, ${pendingHomework} assignment${pendingHomework === 1 ? "" : "s"} open.`;
    if (attendanceRate !== null) return `Attendance stands at ${attendanceRate}%. You have ${pendingHomework} assignment${pendingHomework === 1 ? "" : "s"} open this week.`;
    return "Your school record is up to date. New results, assignments and notices appear here as your teachers publish them.";
  }, [attendanceRate, balance, pendingHomework]);

  return (
    <StudentLayout
      title="Home"
      studentNameOverride={scannedProfile?.full_name}
      studentIdOverride={scannedProfile?.admission_no}
      publicView={Boolean(scannedToken)}
    >
      <main className="student-home portal-page-bg mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] shadow-2xl shadow-primary/10">
        {isShadowIdentity && (
          <div className="mx-5 mt-3 flex items-center gap-2 border-l-2 border-accent px-3 py-2 text-xs text-muted-foreground md:mx-0">
            <BellRing className="student-blue h-4 w-4" /> Admin preview identity — you are viewing a pupil record, not your own.
          </div>
        )}

        <section className="relative min-h-[330px] overflow-hidden px-5 pt-8 md:min-h-[390px] md:px-10 md:pt-12">
          <img src={heroImage} alt="School backpack, books and a plant in a sunlit courtyard" width={1200} height={900} className="absolute inset-y-0 right-0 h-full w-[72%] object-cover object-center md:w-[62%]" />
          <div className="student-hero-fade absolute inset-0" /><PortalHeroArt variant="learning" />
          <div className="relative z-10 max-w-[62%] md:max-w-md">
            <p className="font-editorial student-ink text-[18px] md:text-2xl">{new Date().getHours() < 12 ? "Good morning," : new Date().getHours() < 17 ? "Good afternoon," : "Good evening,"}</p>
            <h1 className="font-editorial student-ink mt-0.5 text-[52px] font-semibold leading-[0.98] md:text-7xl">{firstName}</h1>
            <span className="student-blue-bg mt-3 block h-1 w-20 -rotate-2 rounded-full" />
            <p className="mt-4 text-[11px] font-semibold text-muted-foreground md:text-sm">{todayLabel}</p>
            <p className="mt-5 text-[13px] font-medium text-muted-foreground md:text-base">
              {[className, studentData?.student_id || scannedProfile?.admission_no].filter(Boolean).join("  ·  ") || "Pupil record"}
            </p>
            <p className="mt-7 max-w-[18ch] text-[17px] leading-relaxed text-foreground/75 md:text-xl">Consistency today,<br />confidence <em className="student-blue font-semibold">tomorrow.</em></p>
          </div>
        </section>

        <div className="space-y-8 px-5 pb-6 md:px-10">
          {failed && (
            <div className="flex items-center gap-3 border-y border-destructive/25 py-3 text-sm text-destructive">
              <p className="flex-1">Your latest school data could not be refreshed.</p>
              <Button variant="ghost" size="sm" onClick={() => setReloadKey((value) => value + 1)}><RefreshCw className="mr-1.5 h-4 w-4" />Retry</Button>
            </div>
          )}

          {loading ? <Skeleton className="h-[204px] rounded-2xl" /> : (
            <section className="student-today-surface student-ink relative overflow-hidden rounded-2xl px-6 py-6 md:px-8">
              <div className="student-blue-bg absolute bottom-5 left-8 top-14 w-px opacity-50" />
              <span className="student-blue text-xs font-bold uppercase">Today</span>
              {nextClass ? (
                <div className="mt-5 flex items-start gap-5 pl-5">
                  <span className="student-blue-bg absolute left-[27px] top-[70px] h-3.5 w-3.5 rounded-full ring-4 ring-card md:left-[35px]" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-editorial text-[30px] font-medium leading-tight md:text-4xl">{nextClass.subject_name}</h2>
                    <div className="mt-3 space-y-2 text-[13px] text-foreground/75 md:flex md:gap-5 md:space-y-0 md:text-sm">
                      <p className="flex items-center gap-2"><Clock3 className="student-blue h-4 w-4" />{timeLabel(nextClass.start_time)} – {timeLabel(nextClass.end_time)}</p>
                      <p className="flex items-center gap-2"><MapPin className="student-blue h-4 w-4" />{nextClass.room || "Classroom"} · {nextClass.teacher_name}</p>
                    </div>
                    <Link to="/student/schedule" className="student-blue mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/25 px-5 text-sm font-semibold transition-colors hover:bg-primary-soft">View timetable <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                  <div className="student-blue-soft hidden h-16 w-16 shrink-0 place-items-center rounded-full sm:grid"><BookGlyph className="h-7 w-7" /></div>
                </div>
              ) : (
                <div className="mt-5 pl-5">
                  <h2 className="font-editorial text-[26px] font-medium leading-tight md:text-3xl">No lessons scheduled today</h2>
                  <p className="mt-2 text-[13px] text-muted-foreground md:text-sm">Your timetable appears here once the school publishes this class&apos;s schedule.</p>
                  <Link to="/student/schedule" className="student-blue mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/25 px-5 text-sm font-semibold transition-colors hover:bg-primary-soft">Open timetable <ArrowRight className="h-4 w-4" /></Link>
                </div>
              )}
            </section>
          )}

          <section aria-label="Student status" className="grid grid-cols-3 divide-x divide-border py-1">
            {[
              { icon: TrendGlyph, label: "Attendance", value: attendanceRate === null ? "—" : `${attendanceRate}%`, note: attendanceRate === null ? "Not yet marked" : "This term", tone: "bg-primary-soft text-primary" },
              { icon: ShieldGlyph, label: "Fees", value: balance > 0 ? "Due" : "Clear", note: balance > 0 ? `₦${balance.toLocaleString()} outstanding` : "Nothing outstanding", tone: "bg-warning-container text-warning-container-foreground" },
              { icon: HomeworkGlyph, label: "Homework", value: pendingHomework, note: pendingHomework ? "Open now" : "Nothing due", tone: "bg-error-container text-error-container-foreground" },
            ].map(({ icon: Icon, label, value, note, tone }) => (
              <div key={label} className="flex min-w-0 flex-col items-center px-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", tone)}><Icon className="h-5 w-5" /></span>
                <div className="mt-2 min-w-0 sm:mt-0"><p className="truncate text-[11px] text-muted-foreground">{label}</p><p className="font-editorial text-xl font-semibold leading-tight text-foreground">{value}</p><p className="truncate text-[10px] text-muted-foreground">{note}</p></div>
              </div>
            ))}
          </section>

          <section className="student-status-surface flex items-start gap-3 rounded-xl border border-border/60 px-4 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-primary"><Sparkles className="h-5 w-5" /></span>
            <p className="font-editorial pt-0.5 text-[16px] leading-relaxed text-foreground/80">{statusCopy}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <button onClick={() => window.dispatchEvent(new Event("imagemakers-open-ai"))} className="portal-feature-card group p-5 text-left">
              <div className="relative z-10 flex items-start gap-4">
                <div className="portal-float-icon grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-primary/10"><PortalIconArt kind="ai" className="h-14 w-14"/></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-primary">Study companion</p>
                  <h2 className="portal-display mt-1 text-xl font-extrabold">Ask your AI Tutor</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">Get help understanding homework and lessons. Ask questions; don't just copy answers.</p>
                  <span className="mt-3 inline-flex rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-white">Open tutor →</span>
                </div>
              </div>
            </button>
            <button onClick={() => window.dispatchEvent(new Event("imagemakers-open-calculator"))} className="portal-feature-card group p-5 text-left">
              <div className="relative z-10 flex items-start gap-4">
                <div className="portal-float-icon grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-accent/15"><PortalIconArt kind="cbt" className="h-14 w-14"/></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-accent-foreground">Study tool</p>
                  <h2 className="portal-display mt-1 text-xl font-extrabold">Calculator</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">A simple calculator for maths practice and schoolwork on an approved device.</p>
                  <span className="mt-3 inline-flex rounded-full bg-accent px-3 py-1.5 text-[11px] font-extrabold text-accent-foreground">Open calculator →</span>
                </div>
              </div>
            </button>
          </section>

          <section>
            <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase text-foreground">Recent results</h2><Link to="/student/grades" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">See all <ChevronRight className="h-4 w-4" /></Link></div>
            {recentGrades.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No results have been published to your record yet. They appear here as soon as your teachers release them.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentGrades.map((grade, index) => (
                  <Link key={grade.id} to="/student/grades" className="group flex min-h-[72px] items-center gap-3 py-3">
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", index === 1 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground")}><BookGlyph className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1"><p className="font-editorial truncate text-[17px] font-medium text-foreground">{grade.subjects?.name || "Subject"}</p><p className="text-xs text-muted-foreground">{dayLabel(grade.created_at)}</p></div>
                    <span className={cn("rounded-lg px-3 py-1 font-editorial text-[16px] font-semibold", Number(grade.total_score) >= 80 ? "bg-primary-soft text-primary" : "bg-warning-container text-warning-container-foreground")}>{grade.total_score ?? "—"}%</span>
                    <ChevronRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase text-foreground">School life</h2><Link to="/student/calendar" className="flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">View all <ChevronRight className="h-4 w-4" /></Link></div>
            {moments.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nothing on the school calendar yet. Events and notices from the school office show up here.</p>
            ) : (
              <div className="relative ml-3 border-l border-primary/25 pl-6">
                {moments.map((moment) => (
                  <Link to={moment.kind === "event" ? "/student/calendar" : "/student/announcements"} key={`${moment.kind}-${moment.id}`} className="relative flex min-h-[72px] items-center border-b border-border py-3">
                    <span className={cn("absolute -left-[30px] h-3 w-3 rounded-full ring-4 ring-background", moment.kind === "event" ? "bg-primary" : "bg-accent")} />
                    <div className="min-w-0 flex-1"><p className="font-editorial truncate text-[17px] font-medium">{moment.title}</p><p className="text-xs text-muted-foreground">{dayLabel(moment.date)}</p></div>
                    <span className={cn("grid h-11 w-11 place-items-center rounded-xl", moment.kind === "event" ? "bg-primary-soft text-primary" : "bg-warning-container text-warning-container-foreground")}>
                      {moment.kind === "event" ? <CalendarDays className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between"><div><p className="editorial-eyebrow">Your shortcuts</p><h2 className="portal-display text-xl font-extrabold">Keep moving</h2></div><Link to="/student/resources" className="text-xs font-bold text-primary">See all →</Link></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { kind:"book", label:"Grades", href:"/student/grades" }, { kind:"attendance", label:"Attendance", href:"/student/attendance" },
                { kind:"finance", label:"Fees", href:"/student/fees" }, { kind:"calendar", label:"Schedule", href:"/student/schedule" }, { kind:"book", label:"Reports", href:"/student/reports" },
              ].map(item=><Link key={item.href} to={item.href} className="portal-feature-card group flex min-h-[118px] flex-col justify-between p-4">
                <PortalIconArt kind={item.kind as any} className="h-12 w-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2"/>
                <span className="text-xs font-extrabold">{item.label}<ChevronRight className="ml-1 inline h-3 w-3 text-primary"/></span>
              </Link>)}
            </div>
          </section>
        </div>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
