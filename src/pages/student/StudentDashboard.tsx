import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, CalendarDays, Clock3, MapPin, RefreshCw } from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/student-home-hero.jpg";
import { PortalIllustration } from "@/components/PortalIllustration";

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
interface StudentDashboardProps { scannedToken?: string; }

const timeLabel = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hour, minute));
};
const dayLabel = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(d);
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
        setLoading(true); setFailed(false);
        const [{ data: profileRows, error: profileError }, { data: resultRows, error: resultsError }] = await Promise.all([
          supabase.rpc("public_student_profile", { _token: scannedToken }),
          supabase.rpc("public_student_results", { _token: scannedToken }),
        ]);
        if (profileError || resultsError) { setFailed(true); setLoading(false); return; }
        const profile = ((profileRows as ScannedProfile[]) || [])[0] || null;
        setScannedProfile(profile);
        setClassName(profile?.class_name || "");
        setScannedAttendanceRate(profile && profile.attendance_total > 0 ? Math.round((profile.attendance_present / profile.attendance_total) * 100) : null);
        setRecentGrades(((resultRows as any[]) || []).map((result, index) => ({
          id: `${scannedToken}-${index}`, total_score: result.total_score, letter_grade: result.letter_grade, created_at: null,
          subjects: { name: result.subject || "Subject" },
        })));
        setLoading(false); return;
      }
      if (!studentData?.id) { setLoading(false); return; }
      setLoading(true); setFailed(false);
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
        const events: SchoolMoment[] = ((eventRes.data as any[]) || []).map(e => ({ id:e.id,title:e.title,date:e.event_date,kind:"event" }));
        const notices: SchoolMoment[] = ((annRes.data as any[]) || []).map(a => ({ id:a.id,title:a.title,date:a.created_at,kind:"announcement" }));
        setMoments([...events, ...notices].slice(0,3));

        if (studentData.class_id) {
          const [scheduleRes, homeworkRes, classRes] = await Promise.all([
            supabase.from("schedules").select("id, start_time, end_time, room, subjects (name), teachers (first_name, last_name)").eq("class_id", studentData.class_id).eq("day_of_week", currentDay).order("start_time"),
            supabase.from("assignments").select("id", { count:"exact", head:true }).eq("class_id", studentData.class_id).gte("due_date", new Date().toISOString()),
            supabase.from("classes").select("name").eq("id", studentData.class_id).maybeSingle(),
          ]);
          setTodayClasses(((scheduleRes.data as any[]) || []).map(slot => ({
            id:slot.id,start_time:slot.start_time?.slice(0,5)||"09:00",end_time:slot.end_time?.slice(0,5)||"10:00",
            room:slot.room,subject_name:slot.subjects?.name||"Subject",
            teacher_name:slot.teachers ? `${slot.teachers.first_name} ${slot.teachers.last_name}` : "Teacher",
          })));
          setPendingHomework(homeworkRes.count || 0);
          setClassName((classRes.data as any)?.name || "");
        }
      } catch (error) {
        console.error("Error loading student dashboard:", error); setFailed(true);
      } finally { setLoading(false); }
    };
    load();
  }, [studentData?.id, studentData?.class_id, scannedToken, reloadKey]);

  const scannedNames = scannedProfile?.full_name.trim().split(/\s+/) || [];
  const firstName = studentData?.first_name || scannedNames[0] || "Pupil";
  const presentCount = attendance.filter(item => item.status === "present").length;
  const attendanceRate = scannedToken ? scannedAttendanceRate : attendance.length ? Math.round((presentCount / attendance.length) * 100) : null;
  const nextClass = todayClasses[0];
  const todayLabel = new Intl.DateTimeFormat("en-NG", { weekday:"long", day:"numeric", month:"long" }).format(new Date());
  const statusCopy = useMemo(() => {
    if (balance > 0) return "There is an outstanding fee balance on your record. Review it before the next school payment deadline.";
    if (attendanceRate !== null && attendanceRate >= 90) return `You have ${attendanceRate}% attendance so far. Keep the same steady routine.`;
    if (attendanceRate !== null) return `Your current attendance is ${attendanceRate}%. Keep showing up and staying consistent.`;
    return "Your school record is ready. Results, assignments and notices will appear here when the school publishes them.";
  }, [attendanceRate, balance]);

  return (
    <StudentLayout title="Home" studentNameOverride={scannedProfile?.full_name} studentIdOverride={scannedProfile?.admission_no} publicView={Boolean(scannedToken)}>
      <main className="student-home space-y-5 md:space-y-7">
        {isShadowIdentity && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <BellRing className="h-4 w-4" /> Admin preview identity — this is a pupil record preview.
          </div>
        )}
        {failed && (
          <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="flex-1">Your latest school data could not be refreshed.</p>
            <Button variant="ghost" size="sm" onClick={() => setReloadKey(v => v + 1)}><RefreshCw className="mr-1.5 h-4 w-4"/>Retry</Button>
          </div>
        )}

        <section className="relative overflow-hidden rounded-[30px] border border-[#dfe6e1] bg-[#fbfaf6] shadow-[0_25px_70px_-45px_rgba(48,73,58,.5)]">
          <div className="grid min-h-[360px] md:min-h-[430px] md:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center p-6 md:p-10 lg:p-12">
              <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#4f8063]">Your Imagemakers day</p>
              <h1 className="portal-display mt-3 max-w-xl text-5xl font-extrabold leading-[.95] tracking-[-.055em] text-[#26362b] md:text-7xl">Hello, {firstName}.</h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#657169] md:text-base">{todayLabel}. Here is what matters today — classes, schoolwork, results and the next thing you need to do.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/student/schedule" className="rounded-full bg-[#4f8063] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#4f8063]/15">View today</Link>
                <Link to="/student/homework" className="rounded-full border border-[#d6dfd8] bg-white px-4 py-2.5 text-xs font-extrabold text-[#3e5546]">Homework</Link>
              </div>
              <p className="mt-7 text-xs font-semibold text-[#7a847d]">{[className, studentData?.student_id || scannedProfile?.admission_no].filter(Boolean).join(" · ") || "Pupil record"}</p>
            </div>
            <div className="relative min-h-[220px] overflow-hidden md:min-h-0">
              <img src={heroImage} alt="School learning scene" className="absolute inset-0 h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf6] via-[#fbfaf6]/20 to-transparent md:from-[#fbfaf6] md:via-transparent"/>
              <div className="absolute right-5 top-5 rounded-2xl bg-white/85 p-2 shadow-lg backdrop-blur-sm"><PortalIllustration kind="learning" size="md"/></div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.35fr_.65fr]">
          <div className="portal-surface rounded-[26px] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">Next up</p><h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b] md:text-3xl">Today&apos;s class</h2></div>
              <PortalIllustration kind="schedule" size="sm"/>
            </div>
            {loading ? <Skeleton className="mt-5 h-24 rounded-2xl"/> : nextClass ? (
              <div className="mt-5 rounded-2xl bg-[#f1f5f1] p-4 md:p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#4f8063] shadow-sm"><Clock3 className="h-5 w-5"/></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="portal-display text-xl font-extrabold text-[#26362b]">{nextClass.subject_name}</h3>
                    <p className="mt-1 text-xs text-[#6d776f]">{timeLabel(nextClass.start_time)} – {timeLabel(nextClass.end_time)} · {nextClass.teacher_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#6d776f]"><MapPin className="h-3.5 w-3.5"/> {nextClass.room || "Classroom"}</p>
                  </div>
                  <Link to="/student/schedule" className="hidden shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-extrabold text-[#4f8063] shadow-sm sm:block">Timetable</Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[#d6dfd8] p-5"><h3 className="font-bold text-[#3e5546]">No lessons scheduled today</h3><p className="mt-1 text-xs leading-5 text-[#78817b]">Your timetable will appear here when the school publishes the class schedule.</p></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <div className="portal-surface rounded-[24px] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#7b847d]">Attendance</p><p className="portal-display mt-1 text-3xl font-extrabold text-[#26362b]">{attendanceRate === null ? "—" : `${attendanceRate}%`}</p><p className="text-[11px] text-[#78817b]">{attendanceRate === null ? "Not marked yet" : "This term"}</p></div>
            <div className="portal-surface rounded-[24px] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#7b847d]">Homework</p><p className="portal-display mt-1 text-3xl font-extrabold text-[#26362b]">{pendingHomework}</p><p className="text-[11px] text-[#78817b]">{pendingHomework ? "Open assignment(s)" : "Nothing due"}</p></div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <button onClick={() => window.dispatchEvent(new Event("imagemakers-open-ai"))} className="portal-feature-card group p-5 text-left md:p-6">
            <div className="flex items-start gap-4">
              <PortalIllustration kind="ai" size="lg"/>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#806ca5]">Study companion</p>
                <h2 className="portal-display mt-1 text-2xl font-extrabold text-[#2d2936]">Ask the AI Tutor</h2>
                <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">Ask it to explain a lesson, give you a clue or show you a similar example. It should help you learn — not do your work for you.</p>
                <span className="mt-4 inline-flex rounded-full bg-[#806ca5] px-3.5 py-2 text-[11px] font-extrabold text-white">Open tutor</span>
              </div>
            </div>
          </button>
          <button onClick={() => window.dispatchEvent(new Event("imagemakers-open-calculator"))} className="portal-feature-card group p-5 text-left md:p-6">
            <div className="flex items-start gap-4">
              <PortalIllustration kind="calculator" size="lg"/>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4d7f88]">Study tool</p>
                <h2 className="portal-display mt-1 text-2xl font-extrabold text-[#2d3436]">Calculator</h2>
                <p className="mt-2 max-w-md text-sm leading-5 text-muted-foreground">Useful for checking your working during maths practice on an approved school device.</p>
                <span className="mt-4 inline-flex rounded-full bg-[#4d7f88] px-3.5 py-2 text-[11px] font-extrabold text-white">Open calculator</span>
              </div>
            </div>
          </button>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="portal-surface rounded-[26px] p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">Academic</p><h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b]">Recent results</h2></div><Link to="/student/grades" className="flex items-center gap-1 text-xs font-extrabold text-[#4f8063]">All results <ArrowRight className="h-3.5 w-3.5"/></Link></div>
            {recentGrades.length === 0 ? <p className="mt-6 rounded-2xl bg-[#f5f6f3] p-4 text-sm text-muted-foreground">No results have been published to your record yet.</p> : (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {recentGrades.map(grade => (
                  <Link key={grade.id} to="/student/grades" className="rounded-2xl border border-[#e2e7e2] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs font-bold text-muted-foreground">{grade.subjects?.name || "Subject"}</p>
                    <p className="portal-display mt-2 text-3xl font-extrabold text-[#26362b]">{grade.total_score ?? "—"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{grade.letter_grade ? `Grade ${grade.letter_grade}` : "Grade pending"} · {dayLabel(grade.created_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[26px] bg-[#4f8063] p-5 text-white shadow-[0_22px_55px_-35px_rgba(79,128,99,.7)]">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/65">Your record</p>
            <h2 className="portal-display mt-1 text-2xl font-extrabold">Keep your routine steady.</h2>
            <p className="mt-2 text-sm leading-5 text-white/75">{statusCopy}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/student/attendance" className="rounded-full bg-white px-3.5 py-2 text-[11px] font-extrabold text-[#416b52]">Attendance</Link>
              <Link to="/student/fees" className="rounded-full bg-white/15 px-3.5 py-2 text-[11px] font-extrabold text-white">Fee record</Link>
            </div>
          </div>
        </section>

        <section className="portal-surface rounded-[26px] p-5 md:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#4f8063]">School life</p><h2 className="portal-display mt-1 text-2xl font-extrabold text-[#26362b]">What&apos;s coming up</h2></div><CalendarDays className="h-5 w-5 text-[#8a958d]"/></div>
          {moments.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No upcoming events or announcements have been published yet.</p> : (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {moments.map(moment => (
                <div key={moment.id} className="rounded-2xl bg-[#f5f6f3] p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7b847d]">{moment.kind === "event" ? "Event" : "Announcement"} · {dayLabel(moment.date)}</p>
                  <p className="mt-2 text-sm font-bold text-[#344239]">{moment.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
