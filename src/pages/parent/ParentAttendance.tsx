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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id).then(r => withAdminPreview(r));
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const [studentsRes, attendanceRes] = await Promise.all([
          supabase.from("students").select("*").in("id", ids),
          supabase.from("attendance").select("*").in("student_id", ids).order("date", { ascending: false }).limit(500),
        ]);
        setChildren(studentsRes.data || []);
        setAttendance(attendanceRes.data || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <ParentLayout title="Attendance"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Child's Attendance">
      <div className="space-y-6 animate-fade-in">
        {children.map((child) => {
          const childAtt = attendance.filter((a: any) => a.student_id === child.id);
          const present = childAtt.filter((a: any) => a.status === "present").length;
          const total = childAtt.length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          const absent = childAtt.filter((a: any) => a.status === "absent").length;
          const late = childAtt.filter((a: any) => a.status === "late").length;
          const excused = childAtt.filter((a: any) => a.status === "excused").length;
          const days = eachDayOfInterval({ start: startOfMonth(visibleMonth), end: endOfMonth(visibleMonth) });
          const byDate = new Map(childAtt.map((a: any) => [a.date, a]));
          const statusStyles: Record<string, string> = {
            present: "bg-emerald-500 text-white", absent: "bg-red-500 text-white",
            late: "bg-amber-400 text-slate-900", excused: "bg-slate-200 text-slate-700",
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
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-success/10"><p className="text-2xl font-bold text-success">{present}</p><p className="text-xs text-muted-foreground">Present</p></div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10"><p className="text-2xl font-bold text-destructive">{absent}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                  <div className="text-center p-3 rounded-lg bg-primary/10"><p className="text-2xl font-bold text-primary">{rate}%</p><p className="text-xs text-muted-foreground">Rate</p></div>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Late: <b className="text-foreground">{late}</b></span>
                  <span>Excused: <b className="text-foreground">{excused}</b></span>
                  <span>Recorded days: <b className="text-foreground">{total}</b></span>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Daily attendance</h3>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border p-1.5" aria-label="Previous month" onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}><ChevronLeft className="h-4 w-4"/></button>
                    <span className="min-w-28 text-center text-sm font-medium">{format(visibleMonth, "MMMM yyyy")}</span>
                    <button className="rounded-md border p-1.5" aria-label="Next month" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}><ChevronRight className="h-4 w-4"/></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => <span key={day} className="py-1">{day}</span>)}
                  {Array.from({ length: startOfMonth(visibleMonth).getDay() }).map((_, i) => <span key={"blank-" + i} />)}
                  {days.map(day => {
                    const record: any = byDate.get(format(day, "yyyy-MM-dd"));
                    const tone = record ? statusStyles[record.status] || "bg-muted" : "bg-muted/30 text-muted-foreground";
                    return <div key={day.toISOString()} className={"rounded-md py-2 text-xs " + tone + (isToday(day) ? " ring-2 ring-primary ring-offset-1" : "")}>{format(day, "d")}</div>;
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span>🟢 Present</span><span>🔴 Absent</span><span>🟠 Late</span><span>⚪ Excused</span><span>Unmarked days have no record.</span>
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
