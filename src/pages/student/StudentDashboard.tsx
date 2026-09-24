import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, BookOpen, CalendarDays, CheckCircle2, Clock3, MapPin, NotebookPen, RefreshCw, WalletCards } from "lucide-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
            <BellRing className="h-4 w-4" />
            Admin preview identity — this is a pupil record preview.
          </div>
        )}

        {failed && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="flex-1">Your latest school data could not be refreshed.</p>
            <Button variant="ghost" size="sm" onClick={() => setReloadKey((v) => v + 1)}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        <section className="student-home-hero">
          <div className="student-home-hero-copy">
            <p className="student-kicker">Imagemakers Nursery &amp; Primary School · 2026/27</p>
            <h1 className="student-home-title">Hello, <span>{firstName}</span>.</h1>
            <p className="student-home-lede">
              {todayLabel}. Your school day, work and progress in one calm place.
            </p>
            <div className="student-home-actions">
              <Link to="/student/schedule" className="student-primary-action"><CalendarDays className="h-4 w-4" /> View today</Link>
              <Link to="/student/homework" className="student-secondary-action"><NotebookPen className="h-4 w-4" /> Homework</Link>
            </div>
            <div className="student-home-meta">
              <span>{className || "Class not assigned yet"}</span>
              <span className="student-meta-dot" />
              <span>{studentData?.student_id || scannedProfile?.admission_no || "Admission number pending"}</span>
            </div>
          </div>

          <div className="student-home-visual" aria-hidden="true">
            <div className="student-orbit-ring" />
            <div className="student-art-spark one" />
            <div className="student-art-spark two" />
            <div className="student-art-spark three" />
            <div className="student-study-stack">
              <span className="student-study-sheet" />
              <span className="student-study-book" />
              <span className="student-study-pencil" />
            </div>
            <div className="student-visual-label">Learn · explore · grow</div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Attendance", value: attendanceRate === null ? "—" : `${attendanceRate}%`, note: attendanceRate === null ? "No attendance yet" : "Current term", tone: "sky" },
            { label: "Homework", value: String(pendingHomework), note: pendingHomework ? "Open assignment(s)" : "Nothing due", tone: "gold" },
            { label: "Outstanding", value: balance > 0 ? `₦${balance.toLocaleString("en-NG")}` : "₦0", note: balance > 0 ? "Check fee record" : "No balance recorded", tone: "ink" },
            { label: "Results", value: String(recentGrades.length), note: recentGrades.length ? "Latest records" : "Nothing published yet", tone: "blue" },
          ].map((item) => (
            <div key={item.label} className={cn("student-stat-card", `tone-${item.tone}`)}>
              <div className="flex items-start justify-between gap-3"><p className="student-kicker !tracking-[.12em]">{item.label}</p><span className="student-stat-dot" /></div>
              <p className="student-stat-value">{item.value}</p>
              <p className="student-stat-note">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="student-panel student-panel-blue">
            <div className="flex items-start justify-between gap-4">
              <div><p className="student-kicker text-[#5ec7ef]">Next up</p><h2 className="student-panel-title text-white">Today&apos;s class</h2></div>
              <Clock3 className="h-5 w-5 text-white/55" />
            </div>
            {loading ? <Skeleton className="mt-6 h-24 rounded-2xl bg-white/10" /> : nextClass ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl md:p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#1688bd]"><BookOpen className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">{nextClass.subject_name}</h3>
                    <p className="mt-1 text-xs text-white/70">{timeLabel(nextClass.start_time)} – {timeLabel(nextClass.end_time)} · {nextClass.teacher_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/60"><MapPin className="h-3.5 w-3.5" /> {nextClass.room || "Classroom"}</p>
                  </div>
                  <Link to="/student/schedule" className="hidden rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-white/15 sm:block">Timetable</Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
                <h3 className="font-bold text-white">No lessons scheduled today</h3>
                <p className="mt-1 text-xs leading-5 text-white/60">Your timetable will appear here when the school publishes the class schedule.</p>
              </div>
            )}
          </div>

          <div className="student-panel student-panel-soft">
            <div><p className="student-kicker">Your record</p><h2 className="student-panel-title">Keep your routine steady.</h2><p className="mt-2 text-sm leading-6 text-[#607886]">{statusCopy}</p></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/student/attendance" className="student-mini-link"><CheckCircle2 className="h-4 w-4" />Attendance</Link>
              <Link to="/student/fees" className="student-mini-link"><WalletCards className="h-4 w-4" />Fee record</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => window.dispatchEvent(new Event("imagemakers-open-ai"))} className="student-tool-card student-tool-ai text-left">
            <div className="student-tool-art student-tool-art-ai" aria-hidden="true"><span className="student-tool-orb" /><span className="student-tool-star star-a" /><span className="student-tool-star star-b" /></div>
            <div className="relative z-10">
              <p className="student-kicker text-[#2b7ea9]">Study companion</p>
              <h2 className="student-tool-title">Ask the AI Tutor</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7480]">Get an explanation, a hint or a worked example. For problem-solving, the tutor guides your thinking rather than just handing over an answer.</p>
              <span className="student-tool-action">Open tutor <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </button>

          <button type="button" onClick={() => window.dispatchEvent(new Event("imagemakers-open-calculator"))} className="student-tool-card student-tool-calc text-left">
            <div className="student-tool-art student-tool-art-calc" aria-hidden="true"><span className="student-calc-screen" /><span className="student-calc-keys" /></div>
            <div className="relative z-10">
              <p className="student-kicker text-[#9d6c20]">Maths helper</p>
              <h2 className="student-tool-title">Study calculator</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#5f7480]">Check your working while practising. It opens as an on-page study tool, not a new browser tab.</p>
              <span className="student-tool-action student-tool-action-gold">Open calculator <ArrowRight className="h-3.5 w-3.5" /></span>
            </div>
          </button>
        </section>

        <section className="student-panel">
          <div className="flex items-start justify-between gap-4">
            <div><p className="student-kicker">Academic</p><h2 className="student-panel-title">Recent results</h2></div>
            <Link to="/student/grades" className="student-text-link">All results <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentGrades.length === 0 ? (
            <div className="student-empty-row"><div className="student-empty-mark">01</div><div><p className="font-bold text-[#294b5e]">No results published yet</p><p className="mt-1 text-xs leading-5 text-[#748994]">Your result ledger will appear here when the school enters and publishes marks.</p></div></div>
          ) : (
            <div className="mt-5 grid gap-2 md:grid-cols-3">
              {recentGrades.map((grade,index)=><Link key={grade.id} to="/student/grades" className="student-result-card"><div className="student-result-number">0{index+1}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-[#5d7683]">{grade.subjects?.name || "Subject"}</p><p className="mt-2 text-3xl font-black tracking-tight text-[#17384b]">{grade.total_score ?? "—"}</p><p className="mt-1 text-[11px] text-[#758894]">{grade.letter_grade ? `Grade ${grade.letter_grade}` : "Grade pending"} · {dayLabel(grade.created_at)}</p></div></Link>)}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
          <div className="student-panel student-panel-soft">
            <div className="flex items-start justify-between gap-3">
              <div><p className="student-kicker">School life</p><h2 className="student-panel-title">What&apos;s coming up</h2></div>
              <Link to="/student/calendar" className="student-icon-link" aria-label="Open school calendar"><CalendarDays className="h-4 w-4" /></Link>
            </div>
            {moments.length === 0 ? (
              <div className="student-empty-row mt-5"><div className="student-empty-mark">02</div><div><p className="font-bold text-[#294b5e]">Nothing published yet</p><p className="mt-1 text-xs leading-5 text-[#748994]">Events and announcements will appear here when the school adds them.</p></div></div>
            ) : (
              <div className="mt-5 space-y-2">{moments.map(moment=><div key={`${moment.kind}-${moment.id}`} className="student-moment-row"><span className={cn("student-moment-badge",moment.kind==="event"?"event":"notice")}>{moment.kind==="event"?"Event":"Notice"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#294b5e]">{moment.title}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.10em] text-[#7a8e99]">{dayLabel(moment.date)}</p></div></div>)}</div>
            )}
          </div>

          <div className="student-panel student-footer-panel">
            <div className="student-footer-crest"><img src={npsLogo} alt="Imagemakers" className="h-12 w-auto" /></div>
            <div><p className="student-kicker">A school that keeps records clear</p><h2 className="student-footer-title">Imagemakers Nursery &amp; Primary School</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#607886]">Imparting Wisdom &amp; Morals · 2026/2027 session</p></div>
            <div className="student-footer-links"><Link to="/student/announcements">Announcements</Link><Link to="/student/library">Library</Link><Link to="/student/complaints">Support</Link></div>
          </div>
        </section>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
