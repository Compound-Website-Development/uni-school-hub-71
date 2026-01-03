import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  subject_name: string;
  teacher_name: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentSchedule = () => {
  const { studentData } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentDay = new Date().getDay();

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!studentData?.class_id) {
        // If no class_id, use demo data
        setSchedule([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("schedules")
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            room,
            subjects (name),
            teachers (first_name, last_name)
          `)
          .eq("class_id", studentData.class_id)
          .order("day_of_week")
          .order("start_time");

        if (error) throw error;

        const formatted: ScheduleItem[] = (data || []).map((s: any) => ({
          id: s.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time?.slice(0, 5) || "09:00",
          end_time: s.end_time?.slice(0, 5) || "10:00",
          room: s.room,
          subject_name: s.subjects?.name || "Unknown Subject",
          teacher_name: s.teachers ? `${s.teachers.first_name} ${s.teachers.last_name}` : "TBA",
        }));

        setSchedule(formatted);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [studentData?.class_id]);

  // Demo data fallback
  const demoSchedule = schedule.length > 0 ? schedule : [
    { id: "1", day_of_week: 1, start_time: "08:00", end_time: "09:30", room: "Room 101", subject_name: "Mathematics", teacher_name: "Mr. Johnson" },
    { id: "2", day_of_week: 1, start_time: "09:45", end_time: "11:15", room: "Room 102", subject_name: "English", teacher_name: "Mrs. Smith" },
    { id: "3", day_of_week: 1, start_time: "11:30", end_time: "13:00", room: "Lab 1", subject_name: "Physics", teacher_name: "Dr. Williams" },
    { id: "4", day_of_week: 2, start_time: "08:00", end_time: "09:30", room: "Lab 2", subject_name: "Chemistry", teacher_name: "Mr. Brown" },
    { id: "5", day_of_week: 2, start_time: "09:45", end_time: "11:15", room: "Room 103", subject_name: "Biology", teacher_name: "Mrs. Davis" },
  ];

  const todaySchedule = demoSchedule.filter((s) => s.day_of_week === currentDay);
  const groupedByDay = demoSchedule.reduce((acc, item) => {
    if (!acc[item.day_of_week]) acc[item.day_of_week] = [];
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, ScheduleItem[]>);

  return (
    <StudentLayout title="Schedule">
      <div className="space-y-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">today</span>
              Today's Classes
              <Badge variant="secondary">{dayNames[currentDay]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton items={3} />
            ) : todaySchedule.length === 0 ? (
              <InlineEmptyState icon={Calendar} title="No Classes Today" description="Enjoy your day off!" />
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.subject_name}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.start_time} - {item.end_time}
                          </span>
                          {item.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.room}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {item.teacher_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Weekly Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton items={5} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5].map((day) => (
                  <Card key={day} className={day === currentDay ? "ring-2 ring-primary" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {dayNames[day]}
                        {day === currentDay && <Badge className="text-xs">Today</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {groupedByDay[day] && groupedByDay[day].length > 0 ? (
                        groupedByDay[day].map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-foreground truncate">{item.subject_name}</span>
                            <span className="text-muted-foreground ml-2">{item.start_time}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No classes</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
