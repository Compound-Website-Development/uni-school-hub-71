import { withAdminPreview } from "@/lib/adminPreview";
import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isToday } from "date-fns";

const ParentAttendance = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [schoolEvents, setSchoolEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id).then(r => withAdminPreview(r));
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const [studentsRes, attendanceRes] = await Promise.all([
          supabase.from("students").select("*").in("id", ids),
          supabase.from("attendance").select("*").in("student_id", ids).order("date", { ascending: false }).limit(1000),
        ]);
        setChildren(studentsRes.data || []);
        setAttendance(attendanceRes.data || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const firstDay = format(startOfMonth(visibleMonth), "yyyy-MM-dd");
    const lastDay = format(endOfMonth(visibleMonth), "yyyy-MM-dd");
    supabase
      .from("school_events")
      .select("id, title, event_date, end_date, category")
      // Include events that began before this month but continue into it.
      .or(`and(event_date.gte.${firstDay},event_date.lte.${lastDay}),and(event_date.lt.${firstDay},end_date.gte.${firstDay})`)
      .then(({ data, error }) => {
        if (error) {
          console.error("Could not load school calendar events:", error);
          setSchoolEvents([]);
          return;
        }
        setSchoolEvents(data || []);
      });
  }, [visibleMonth]);

  if (isLoading) {
    return <ParentLayout title="Attendance"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Child's Attendance">
      <div className="space-y-6 animate-fade-in">
        {children.map((child) => {
          const childAtt = attendance.filter((a: any) => a.student_id === child.id);
          const present = childAtt.filter((a: any) => a.status === "present").length;
          const absent = childAtt.filter((a: any) => a.status === "absent").length;
          const late = childAtt.filter((a: any) => a.status === "late").length;
          const excused = childAtt.filter((a: any) => a.status === "excused").length;
          const total = childAtt.length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          const monthDays = eachDayOfInterval({ start: startOfMonth(visibleMonth), end: endOfMonth(visibleMonth) });
          const byDate = new Map(childAtt.map((record: any) => [record.date, record]));
          const holidayDates = new Set<string>();
          schoolEvents.forEach((event: any) => {
            if (!/holiday/i.test(`${event.category || ""} ${event.title || ""}`)) return;
            const startDate = new Date(`${event.event_date}T00:00:00`);
            const endDate = new Date(`${event.end_date || event.event_date}T00:00:00`);
            eachDayOfInterval({ start: startDate, end: endDate }).forEach((day) => holidayDates.add(format(day, "yyyy-MM-dd")));
          });
          const holidayCount = holidayDates.size;
          const statusStyles: Record<string, string> = {
            present: "bg-emerald-600 text-white",
            absent: "bg-red-600 text-white",
            late: "bg-amber-400 text-slate-900",
            excused: "bg-slate-300 text-slate-800",
            holiday: "bg-sky-600 text-white",
          };
          return (
            <Card key={child.id} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {child.first_name} {child.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
                  <div className="text-center p-3 rounded-lg bg-success/10"><p className="text-2xl font-bold text-success">{present}</p><p className="text-xs text-muted-foreground">Present</p></div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10"><p className="text-2xl font-bold text-destructive">{absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                  <div className="text-center p-3 rounded-lg bg-warning/10"><p className="text-2xl font-bold text-foreground">{late}</p><p className="text-xs text-muted-foreground">Late</p></div>
                  <div className="text-center p-3 rounded-lg bg-primary/10"><p className="text-2xl font-bold text-primary">{rate}%</p><p className="text-xs text-muted-foreground">Present rate</p></div>
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm">Daily attendance</h3>
                    <p className="text-xs text-muted-foreground">{excused} excused · {holidayCount} holiday date(s) this month</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-md border p-1.5" aria-label="Previous month" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}><ChevronLeft className="h-4 w-4" /></button>
                    <span className="min-w-28 text-center text-sm font-medium">{format(visibleMonth, "MMMM yyyy")}</span>
                    <button type="button" className="rounded-md border p-1.5" aria-label="Next month" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-1">{day}</span>)}
                  {Array.from({ length: startOfMonth(visibleMonth).getDay() }).map((_, index) => <span key={`blank-${index}`} />)}
                  {monthDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const record: any = byDate.get(dateKey);
                    const status = record?.status || (holidayDates.has(dateKey) ? "holiday" : "");
                    const tone = status ? statusStyles[status] || "bg-muted text-foreground" : "bg-muted/30 text-muted-foreground";
                    return (
                      <div key={dateKey} title={status ? `${format(day, "d MMM yyyy")}: ${status}` : `${format(day, "d MMM yyyy")}: no attendance record`}
                        className={`rounded-md py-2 text-xs ${tone} ${isToday(day) ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                        {format(day, "d")}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span><b className="text-emerald-600">●</b> Present</span>
                  <span><b className="text-red-600">●</b> Absent</span>
                  <span><b className="text-amber-500">●</b> Late</span>
                  <span><b className="text-slate-500">●</b> Excused</span>
                  <span><b className="text-sky-600">●</b> Holiday</span>
                  <span>Neutral days have no record.</span>
                </div>
                <div className="mt-5 space-y-1">
                  {childAtt.slice(0, 10).map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center p-2 rounded bg-muted/20 text-sm">
                      <span>{new Date(a.date).toLocaleDateString()}</span>
                      <Badge variant={a.status === "present" ? "default" : "destructive"} className="capitalize">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {children.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>}
      </div>
    </ParentLayout>
  );
};

export default ParentAttendance;
