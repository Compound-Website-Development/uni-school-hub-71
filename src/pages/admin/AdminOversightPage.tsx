import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Clock3, CalendarDays, BookOpen, MonitorPlay } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const time = (value?: string | null) => value ? format(new Date(value), "dd MMM yyyy, h:mm a") : "—";
const day = (value?: number | null) => value == null ? "—" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][value] || "—";

const AdminOversightPage = () => {
  const [clockins, setClockins] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [attendanceRes, scheduleRes, plansRes, examsRes] = await Promise.all([
      supabase.from("staff_attendance").select("*, teachers(first_name,last_name,employee_id)").order("date", { ascending: false }).limit(250),
      supabase.from("schedules").select("*, classes(name,arm), subjects(name), teachers(first_name,last_name)").order("day_of_week").order("start_time"),
      supabase.from("lesson_plans").select("*, classes(name,arm), subjects(name), teachers(first_name,last_name)").order("date", { ascending: false }).limit(250),
      supabase.from("exams").select("*, classes(name,arm), subjects(name)").order("created_at", { ascending: false }).limit(250),
    ]);
    const failures = [attendanceRes, scheduleRes, plansRes, examsRes].filter(r => r.error);
    if (failures.length) toast.error("Some oversight records could not load. Check the relevant admin permissions and database policies.");
    setClockins(attendanceRes.data || []);
    setSchedules(scheduleRes.data || []);
    setPlans(plansRes.data || []);
    setExams(examsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);
  const teacherName = (row: any) => [row?.teachers?.first_name, row?.teachers?.last_name].filter(Boolean).join(" ") || "Unassigned";
  const className = (row: any) => [row?.classes?.name, row?.classes?.arm].filter(Boolean).join(" — ") || "All classes";

  return <AdminLayout title="Staff & Class Oversight">
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Staff and academic oversight</h2><p className="text-sm text-muted-foreground">Read-only overview of clock-ins, teaching schedules, lesson notes and CBT exams. Records come from the school database.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><Clock3 className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Clock-in records loaded</p><p className="text-2xl font-bold">{clockins.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><CalendarDays className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Scheduled lessons</p><p className="text-2xl font-bold">{schedules.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><BookOpen className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">Lesson notes</p><p className="text-2xl font-bold">{plans.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><MonitorPlay className="mb-2 h-5 w-5 text-primary"/><p className="text-xs text-muted-foreground">CBT exams</p><p className="text-2xl font-bold">{exams.length}</p></CardContent></Card>
      </div>
      <Tabs defaultValue="clockins" className="space-y-4">
        <TabsList className="h-auto flex-wrap"><TabsTrigger value="clockins">Teacher clock-ins</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger><TabsTrigger value="notes">Lesson notes</TabsTrigger><TabsTrigger value="cbt">CBT exams</TabsTrigger></TabsList>
        <TabsContent value="clockins"><Card><CardHeader><CardTitle className="text-base">Staff attendance history</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Teacher</th><th className="p-2">Clocked in</th><th className="p-2">Clocked out</th><th className="p-2">Status</th></tr></thead><tbody>{clockins.map(r=><tr key={r.id} className="border-b"><td className="p-2">{r.date || "—"}</td><td className="p-2">{teacherName(r)}</td><td className="p-2">{time(r.clock_in)}</td><td className="p-2">{time(r.clock_out)}</td><td className="p-2"><Badge variant={r.is_late ? "destructive" : "secondary"}>{r.is_late ? "Late" : "On time / not flagged"}</Badge></td></tr>)}{!clockins.length&&<tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{loading?"Loading records…":"No staff clock-in records were returned."}</td></tr>}</tbody></table></CardContent></Card></TabsContent>
        <TabsContent value="timetable"><Card><CardHeader><CardTitle className="text-base">School teaching timetable</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Day</th><th className="p-2">Time</th><th className="p-2">Class / arm</th><th className="p-2">Subject</th><th className="p-2">Teacher</th><th className="p-2">Room</th></tr></thead><tbody>{schedules.map(r=><tr key={r.id} className="border-b"><td className="p-2">{day(r.day_of_week)}</td><td className="p-2">{String(r.start_time||"").slice(0,5)}–{String(r.end_time||"").slice(0,5)}</td><td className="p-2">{className(r)}</td><td className="p-2">{r.subjects?.name||"—"}</td><td className="p-2">{teacherName(r)}</td><td className="p-2">{r.room||"—"}</td></tr>)}{!schedules.length&&<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{loading?"Loading timetable…":"No timetable records were returned."}</td></tr>}</tbody></table></CardContent></Card></TabsContent>
        <TabsContent value="notes"><Card><CardHeader><CardTitle className="text-base">Teacher lesson notes and approval status</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Topic</th><th className="p-2">Class</th><th className="p-2">Subject</th><th className="p-2">Teacher</th><th className="p-2">Status</th></tr></thead><tbody>{plans.map(r=><tr key={r.id} className="border-b"><td className="p-2">{r.date||"—"}</td><td className="p-2">{r.topic||"Untitled"}</td><td className="p-2">{className(r)}</td><td className="p-2">{r.subjects?.name||"—"}</td><td className="p-2">{teacherName(r)}</td><td className="p-2"><Badge variant="outline">{r.status||"Submitted"}</Badge></td></tr>)}{!plans.length&&<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{loading?"Loading lesson notes…":"No lesson notes were returned."}</td></tr>}</tbody></table></CardContent></Card></TabsContent>
        <TabsContent value="cbt"><Card><CardHeader><CardTitle className="text-base">CBT exams</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Exam</th><th className="p-2">Class</th><th className="p-2">Subject</th><th className="p-2">Duration</th><th className="p-2">Status</th><th className="p-2">Created</th></tr></thead><tbody>{exams.map(r=><tr key={r.id} className="border-b"><td className="p-2">{r.title}</td><td className="p-2">{className(r)}</td><td className="p-2">{r.subjects?.name||"—"}</td><td className="p-2">{r.duration_minutes||"—"} min</td><td className="p-2"><Badge variant="outline">{r.status||"Draft"}</Badge></td><td className="p-2">{time(r.created_at)}</td></tr>)}{!exams.length&&<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{loading?"Loading exams…":"No CBT exams were returned."}</td></tr>}</tbody></table></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  </AdminLayout>;
};

export default AdminOversightPage;
