import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SCHOOL } from "@/lib/schoolConfig";
import { printDocument } from "@/lib/finance";
import { ArrowLeft, BadgeCheck, BarChart3, CalendarCheck, Download, Medal, Sparkles, ShieldCheck } from "lucide-react";

const letterFor = (score: number | null) => {
  if (score == null) return "-";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  if (score >= 40) return "E";
  return "F";
};

const StudentReportCard = () => {
  const { studentData } = useAuth();
  const [terms, setTerms] = useState<any[]>([]);
  const [termId, setTermId] = useState("");
  const [grades, setGrades] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [attendance, setAttendance] = useState<{ present: number; total: number }>({ present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("terms").select("id, name, session, is_current").order("created_at", { ascending: false });
      if (data?.length) {
        setTerms(data);
        setTermId((data.find((t: any) => t.is_current) || data[0]).id);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!studentData?.id || !termId) return;
      const [{ data: g }, { data: r }, { count: present }, { count: total }] = await Promise.all([
        supabase
          .from("grades")
          .select("continuous_assessment, exam_score, total_score, letter_grade, remark, subjects(name)")
          .eq("student_id", studentData.id)
          .eq("term_id", termId),
        supabase
          .from("term_results")
          .select("*")
          .eq("student_id", studentData.id)
          .eq("term_id", termId)
          .eq("is_published", true)
          .maybeSingle(),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("student_id", studentData.id).eq("status", "present"),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("student_id", studentData.id),
      ]);
      setGrades(g || []);
      setResult(r);
      setAttendance({ present: present || 0, total: total || 0 });
    };
    load();
  }, [studentData?.id, termId]);

  const term = terms.find((t) => t.id === termId);
  const obtained = grades.reduce((s, g) => s + Number(g.total_score || 0), 0);
  const obtainable = grades.length * 100;
  const average = result?.average != null ? Number(result.average) : obtainable ? (obtained / obtainable) * 100 : null;
  const attendancePct = result?.times_opened
    ? Math.round(((result.times_present || 0) / result.times_opened) * 100)
    : attendance.total
      ? Math.round((attendance.present / attendance.total) * 100)
      : null;

  const best = [...grades].sort((a, b) => Number(b.total_score || 0) - Number(a.total_score || 0))[0];
  const weakest = [...grades].sort((a, b) => Number(a.total_score || 0) - Number(b.total_score || 0))[0];
  const insights = grades.length
    ? [
        best && `Strongest subject: ${best.subjects?.name} (${Number(best.total_score || 0)}%).`,
        weakest && best !== weakest && `Focus area: ${weakest.subjects?.name} (${Number(weakest.total_score || 0)}%).`,
        average != null && `Term average of ${average.toFixed(1)}% — ${average >= 60 ? "on track for promotion" : "extra revision recommended"}.`,
      ].filter(Boolean)
    : [];

  const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student";

  return (
    <StudentLayout title="Report Card">
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <Link to="/student/grades" className="flex items-center gap-2 text-sm text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> My Results
        </Link>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Report Card</h1>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-44 rounded-xl"><SelectValue placeholder="Select term" /></SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}{t.session ? ` — ${t.session}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <div id="student-report-card" className="space-y-4">
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-primary/10"><ShieldCheck className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">OFFICIAL REPORT CARD</h2>
                    <p className="text-sm text-muted-foreground">{SCHOOL.name}</p>
                  </div>
                </div>
                {result ? (
                  <Badge className="bg-success/10 text-success border-0 gap-1"><BadgeCheck className="w-3 h-3" /> Verified record</Badge>
                ) : (
                  <Badge variant="secondary">Awaiting publication</Badge>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pupil name</p>
                    <p className="font-semibold text-foreground">{studentName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pupil ID</p>
                    <p className="font-semibold text-foreground">{studentData?.student_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Academic term</p>
                    <p className="font-semibold text-foreground">{term?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Session</p>
                    <p className="font-semibold text-foreground">{term?.session || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: CalendarCheck, label: "Attendance", value: attendancePct != null ? `${attendancePct}%` : "—" },
                { icon: BarChart3, label: "Total Marks", value: obtainable ? `${obtained}/${obtainable}` : "—" },
                { icon: Medal, label: "Overall Grade", value: letterFor(average) },
              ].map((s) => (
                <Card key={s.label} className="rounded-2xl bg-primary/5 border-0 shadow-card">
                  <CardContent className="p-4 text-center">
                    <s.icon className="w-4 h-4 mx-auto text-primary" />
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-2">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-5 space-y-3">
                <h2 className="font-semibold text-foreground">Subject Performance</h2>
                {grades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No results recorded for this term yet.</p>
                ) : (
                  grades.map((g, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground">{g.subjects?.name || "Subject"}</p>
                        <Badge variant="secondary" className="text-xs">{g.letter_grade || letterFor(Number(g.total_score))}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-center text-sm">
                        <div><p className="text-[11px] text-muted-foreground">CA</p><p className="font-semibold">{g.continuous_assessment ?? "—"}</p></div>
                        <div><p className="text-[11px] text-muted-foreground">Exam</p><p className="font-semibold">{g.exam_score ?? "—"}</p></div>
                        <div><p className="text-[11px] text-muted-foreground">Total</p><p className="font-bold">{g.total_score ?? "—"}</p></div>
                      </div>
                      {g.remark && <p className="text-xs text-muted-foreground mt-2">{g.remark}</p>}
                    </div>
                  ))
                )}
                {result?.class_position && (
                  <p className="text-xs text-muted-foreground text-right">
                    Class position: {result.class_position}
                    {result.class_size ? ` / ${result.class_size}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>

            {(result?.teacher_comment || result?.principal_comment) && (
              <Card className="rounded-2xl bg-primary/5 border-0 shadow-card">
                <CardContent className="p-5 space-y-3">
                  {result.teacher_comment && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Class teacher's remarks</p>
                      <p className="text-sm italic text-foreground mt-1">"{result.teacher_comment}"</p>
                    </div>
                  )}
                  {result.principal_comment && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Head teacher's remarks</p>
                      <p className="text-sm italic text-foreground mt-1">"{result.principal_comment}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {insights.length > 0 && (
              <Card className="rounded-2xl shadow-card">
                <CardContent className="p-5 space-y-2">
                  <h2 className="font-semibold text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Smart Insights</h2>
                  <ul className="space-y-1.5">
                    {insights.map((t, i) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Button
          className="w-full shadow-md print:hidden"
          onClick={() => printDocument("student-report-card", `Report Card — ${studentName}`)}
        >
          <Download className="w-4 h-4 mr-2" /> Download / Print Report Card
        </Button>
      </div>
    </StudentLayout>
  );
};

export default StudentReportCard;
