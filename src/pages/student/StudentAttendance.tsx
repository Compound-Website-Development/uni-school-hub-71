import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudentPhoto } from "@/components/StudentPhoto";
import { AppCard, SectionHeader, RuleList, EmptyState, StatusWord } from "@/components/student/editorial";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const StudentAttendance = () => {
  const { studentData } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentData?.id) {
        setIsLoading(false);
        return;
      }
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
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const absentDays = attendance.filter((a) => a.status === "absent").length;
  const lateDays = attendance.filter((a) => a.status === "late").length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const leadingBlanks = getDay(startOfMonth(currentMonth));

  const statusFor = (day: Date) => attendance.find((a) => isSameDay(new Date(a.date), day))?.status || null;

  const dayStyle = (status: string | null) => {
    if (status === "present") return "bg-success/15 text-success font-bold";
    if (status === "late") return "bg-warning/20 text-warning font-bold";
    if (status === "absent") return "bg-destructive/15 text-destructive font-bold";
    return "text-muted-foreground";
  };

  const marked = attendance.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const name = studentData ? `${studentData.first_name} ${studentData.last_name}` : "Pupil";

  return (
    <StudentLayout title="My Attendance" back="/student">
      <div className="student-attendance-page mx-auto w-full max-w-4xl space-y-5 pb-6">
        {/* Overall card */}
        <AppCard className="animate-fade-up">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-[3px] ring-primary/20">
              <StudentPhoto
                photoRef={(studentData as any)?.photo_url}
                alt={name}
                fallback={
                  <span className="grid h-full w-full place-items-center bg-primary/10 font-display text-sm font-bold text-primary">
                    {(studentData?.first_name?.[0] || "S") + (studentData?.last_name?.[0] || "")}
                  </span>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[16px] font-extrabold tracking-tight text-foreground">{name}</p>
              <p className="num truncate text-[12px] text-muted-foreground">Roll No: {studentData?.student_id || "—"}</p>
            </div>
            <div className="text-right">
              <p className="font-display num text-[24px] font-extrabold leading-none text-primary">
                {percentage !== null ? `${percentage}%` : "—"}
              </p>
              <p className="text-[10.5px] font-semibold text-muted-foreground">Overall</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percentage ?? 0}%` }} />
          </div>
        </AppCard>

        {/* Counts */}
        <AppCard padded={false} className="animate-fade-up overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border/60">
            {[
              { label: "Present", value: presentDays, cls: "text-success" },
              { label: "Absent", value: absentDays, cls: "text-destructive" },
              { label: "Late", value: lateDays, cls: "text-warning" },
            ].map((s) => (
              <div key={s.label} className="py-4 text-center">
                <p className={cn("font-display num text-[26px] font-extrabold leading-none", s.cls)}>{s.value}</p>
                <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </AppCard>

        {/* Calendar */}
        <AppCard className="animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="press grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-[15px] font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</p>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="press grid h-9 w-9 place-items-center rounded-xl bg-muted text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d} className="pb-1 text-[10.5px] font-bold text-muted-foreground">{d}</span>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => <span key={`b${i}`} />)}
            {monthDays.map((day) => {
              const status = statusFor(day);
              return (
                <span
                  key={day.toISOString()}
                  title={`${format(day, "d MMM")} — ${status || "not marked"}`}
                  className={cn(
                    "num mx-auto grid h-9 w-9 place-items-center rounded-full text-[12.5px] transition-transform hover:scale-105",
                    dayStyle(status),
                    isToday(day) && "ring-2 ring-primary",
                  )}
                >
                  {format(day, "d")}
                </span>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-border/60 pt-3">
            {[
              { label: "Present", cls: "bg-success" },
              { label: "Late", cls: "bg-warning" },
              { label: "Absent", cls: "bg-destructive" },
              { label: "Not marked", cls: "bg-muted-foreground/30" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", l.cls)} />
                <span className="text-[11px] font-semibold text-muted-foreground">{l.label}</span>
              </span>
            ))}
          </div>
        </AppCard>

        <section>
          <SectionHeader title="Register Entries" />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading register…</p>
          ) : marked.length ? (
            <RuleList>
              {marked.map((a, i) => (
                <li key={`${a.date}-${i}`} className="flex items-center gap-3 py-3">
                  <span className="num w-20 shrink-0 text-[12px] font-bold text-primary">
                    {format(new Date(a.date), "EEE d MMM")}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">{a.notes || "—"}</p>
                  <StatusWord
                    label={a.status}
                    tone={a.status === "absent" ? "alert" : a.status === "late" ? "accent" : "success"}
                  />
                </li>
              ))}
            </RuleList>
          ) : (
            <EmptyState title="Nothing marked this month" hint="Use the arrows to look at an earlier month." />
          )}
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
