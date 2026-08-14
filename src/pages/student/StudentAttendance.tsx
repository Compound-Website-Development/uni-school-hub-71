import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, CheckCircle, XCircle, Clock, Percent } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";

const StudentAttendance = () => {
  const { studentData } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentData?.id) return;
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const { data } = await supabase
        .from("attendance")
        .select("date, status, notes")
        .eq("student_id", studentData.id)
        .gte("date", start)
        .lte("date", end);

      setAttendance(data || []);
      setIsLoading(false);
    };
    fetchAttendance();
  }, [studentData, currentMonth]);

  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === "present").length;
  const absentDays = attendance.filter(a => a.status === "absent").length;
  const lateDays = attendance.filter(a => a.status === "late").length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getStatusForDay = (day: Date) => {
    const record = attendance.find(a => isSameDay(new Date(a.date), day));
    return record?.status || null;
  };

  const statusColor: Record<string, string> = {
    present: "bg-success text-success-foreground",
    absent: "bg-destructive text-destructive-foreground",
    late: "bg-warning text-warning-foreground",
  };

  const stats = [
    { icon: CalendarDays, label: "Total Days", value: totalDays, variant: "primary" as const },
    { icon: CheckCircle, label: "Present", value: presentDays, variant: "success" as const },
    { icon: XCircle, label: "Absent", value: absentDays, variant: "destructive" as const },
    { icon: Percent, label: "Attendance %", value: `${percentage}%`, variant: "primary" as const },
  ];

  const variantBg = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <StudentLayout title="Attendance">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your daily attendance record</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="rounded-xl border-border/50 shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${variantBg[s.variant]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Calendar */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="px-3 py-1 text-sm rounded-md border border-border hover:bg-muted transition-colors">Prev</button>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="px-3 py-1 text-sm rounded-md border border-border hover:bg-muted transition-colors">Next</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-xs font-semibold text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the month starts */}
              {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {daysInMonth.map((day) => {
                const status = getStatusForDay(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      status ? statusColor[status] : isWeekend ? "bg-muted/30 text-muted-foreground" : "bg-card text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success" /><span className="text-xs text-muted-foreground">Present</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive" /><span className="text-xs text-muted-foreground">Absent</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-warning" /><span className="text-xs text-muted-foreground">Late</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
