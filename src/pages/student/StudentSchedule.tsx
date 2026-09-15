import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, User, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  teacher_name: string;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const StudentSchedule = () => {
  const { studentData } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [attendance, setAttendance] = useState<{ date: string; status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date();
  const currentDay = today.getDay();
  const [selectedDay, setSelectedDay] = useState(currentDay === 0 || currentDay === 6 ? 1 : currentDay);

  useEffect(() => {
    const load = async () => {
      try {
        if (studentData?.class_id) {
          const { data } = await supabase
            .from("schedules")
            .select("id, day_of_week, start_time, end_time, room, subjects (name), teachers (first_name, last_name)")
            .eq("class_id", studentData.class_id)
            .order("day_of_week")
            .order("start_time");
          setSchedule(
            (data || []).map((s: any) => ({
              id: s.id,
              day_of_week: s.day_of_week,
              start_time: s.start_time?.slice(0, 5) || "09:00",
              end_time: s.end_time?.slice(0, 5) || "10:00",
              room: s.room,
              subject_name: s.subjects?.name || "Subject",
              teacher_name: s.teachers ? `${s.teachers.first_name} ${s.teachers.last_name}` : "TBA",
            })),
          );
        }
        if (studentData?.id) {
          const { data: att } = await supabase
            .from("attendance")
            .select("date, status")
            .eq("student_id", studentData.id)
            .order("date", { ascending: false })
            .limit(60);
          setAttendance(att || []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [studentData?.class_id, studentData?.id]);

  const todayClasses = schedule
    .filter((s) => s.day_of_week === currentDay)
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nextClass = todayClasses.find((c) => toMinutes(c.start_time) > nowMinutes);
  const minutesToNext = nextClass ? toMinutes(nextClass.start_time) - nowMinutes : null;

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : null;
  const recent = [...attendance].reverse().slice(-14);

  const selectedDaySchedule = schedule
    .filter((s) => s.day_of_week === selectedDay)
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

  return (
    <StudentLayout title="Schedule">
      <div className="space-y-6">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-foreground">Schedule &amp; Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Your next class, attendance summary and timetable</p>
        </div>

        {/* Next class hero */}
        <Card className="rounded-2xl border-0 bg-primary text-primary-foreground shadow-lg overflow-hidden animate-fade-up">
          <CardContent className="p-6 relative">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary-foreground/10" />
            <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
              {nextClass ? "Next class in" : "Next class"}
            </p>
            {nextClass ? (
              <>
                <p className="text-4xl font-bold mt-1 tabular-nums">
                  {String(Math.floor((minutesToNext || 0) / 60)).padStart(2, "0")}:
                  {String((minutesToNext || 0) % 60).padStart(2, "0")}
                </p>
                <p className="text-lg font-semibold mt-3">{nextClass.subject_name}</p>
                <p className="text-sm opacity-80">
                  {nextClass.teacher_name}
                  {nextClass.room ? ` • ${nextClass.room}` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mt-2">No more classes today</p>
                <p className="text-sm opacity-80 mt-1">Check tomorrow's timetable below.</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance summary */}
        <Card className="rounded-2xl shadow-card animate-fade-up animation-delay-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Attendance</h2>
              {attendanceRate !== null && (
                <Badge className="bg-success/10 text-success border-0 gap-1">
                  <TrendingUp className="w-3 h-3" /> {attendanceRate}%
                </Badge>
              )}
            </div>
            {recent.length > 0 ? (
              <div className="mt-4 grid grid-cols-7 gap-2">
                {recent.map((a) => (
                  <div key={a.date} className="flex flex-col items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">{new Date(a.date).getDate()}</span>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        a.status === "present" ? "bg-success" : a.status === "late" ? "bg-warning" : "bg-destructive",
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">No attendance recorded yet.</p>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Absent</span>
              </div>
              <Link to="/student/attendance" className="font-semibold text-primary hover:underline">Full Report</Link>
            </div>
          </CardContent>
        </Card>

        {/* Today's schedule */}
        <div className="space-y-3 animate-fade-up animation-delay-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Today's Schedule</h2>
            <Badge variant="secondary" className="text-xs">
              {today.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
            </Badge>
          </div>
          {isLoading ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : todayClasses.length === 0 ? (
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">No classes today.</CardContent>
            </Card>
          ) : (
            todayClasses.map((item) => {
              const done = toMinutes(item.end_time) < nowMinutes;
              const isNext = nextClass?.id === item.id;
              return (
                <Card
                  key={item.id}
                  className={cn(
                    "rounded-2xl shadow-card overflow-hidden transition-all",
                    isNext && "ring-2 ring-primary/40",
                    done && "opacity-60",
                  )}
                >
                  <CardContent className="p-4 flex gap-4">
                    <div className="text-sm w-16 shrink-0">
                      <p className={cn("font-semibold", isNext ? "text-primary" : "text-foreground")}>{item.start_time}</p>
                      <p className="text-muted-foreground text-xs">{item.end_time}</p>
                    </div>
                    <div className="flex-1 border-l border-border pl-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={cn("font-semibold text-foreground", done && "line-through")}>{item.subject_name}</h3>
                        {isNext && <Badge className="bg-primary/10 text-primary border-0 text-[10px]">UP NEXT</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <User className="w-3.5 h-3.5" /> {item.teacher_name}
                      </p>
                      {item.room && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {item.room}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Weekly timetable */}
        <div className="space-y-3 animate-fade-up animation-delay-300">
          <h2 className="font-semibold text-foreground">Weekly Timetable</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 shadow-sm",
                  selectedDay === day ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-foreground hover:bg-muted",
                )}
              >
                {dayNames[day]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" /> {fullDayNames[selectedDay]} — {selectedDaySchedule.length} classes
          </div>
          <div className="space-y-2">
            {selectedDaySchedule.map((item) => (
              <Card key={item.id} className="rounded-xl shadow-card">
                <CardContent className="p-3 flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground w-28 shrink-0">
                    <Clock className="w-3.5 h-3.5" /> {item.start_time}-{item.end_time}
                  </span>
                  <span className="font-medium text-foreground flex-1">{item.subject_name}</span>
                  {item.room && <span className="text-xs text-muted-foreground">{item.room}</span>}
                </CardContent>
              </Card>
            ))}
            {selectedDaySchedule.length === 0 && (
              <p className="text-sm text-muted-foreground">No classes scheduled for this day.</p>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
