import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Calendar, BookOpen, MessageCircle, PlayCircle, Clock } from "lucide-react";

interface Grade {
  id: string;
  total_score: number | null;
  letter_grade: string | null;
  subjects: { name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { name: string } | null;
}

const StudentDashboard = () => {
  const { studentData } = useAuth();
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [termResult, setTermResult] = useState<TermResult | null>(null);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentData?.id) return;

      try {
        // Fetch recent grades
        const { data: grades } = await supabase
          .from("grades")
          .select(`
            id,
            total_score,
            letter_grade,
            subjects (name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (grades) {
          setRecentGrades(grades);
        }

        // Fetch current term result
        const { data: result } = await supabase
          .from("term_results")
          .select(`
            gpa,
            class_position,
            class_size,
            terms (name)
          `)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (result) {
          setTermResult(result);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentData?.id]);

  const studentName = studentData 
    ? `${studentData.first_name} ${studentData.last_name}`
    : "Student";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Mock schedule data - would come from a schedule table
  const upcomingClasses = [
    { time: "08:00 AM", subject: "English Language", room: "Room 101", teacher: "Mr. Jallow" },
    { time: "10:00 AM", subject: "Mathematics", room: "Room 204", teacher: "Mrs. Ceesay" },
    { time: "12:00 PM", subject: "History", room: "Room 108", teacher: "Mr. Camara" },
    { time: "02:00 PM", subject: "Islamic Studies", room: "Room 112", teacher: "Sheikh Fatty" },
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {getGreeting()}, {studentData?.first_name || "Student"} 👋
          </h2>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{currentDate}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon="trending_up"
                label="Current GPA"
                value={termResult?.gpa?.toFixed(2) || "N/A"}
                variant="primary"
              />
              <StatCard
                icon="analytics"
                label="Cumulative GPA"
                value="3.06"
                variant="success"
              />
              <StatCard
                icon="emoji_events"
                label="Class Position"
                value={termResult?.class_position 
                  ? `${termResult.class_position}/${termResult.class_size || "?"}`
                  : "N/A"}
                variant="warning"
              />
              <StatCard
                icon="calendar_today"
                label="Current Term"
                value={termResult?.terms?.name || "Term 1"}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <Link to="/student/schedule">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((cls, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  idx === 0 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-secondary/50 border-border"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {idx === 0 ? <PlayCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{cls.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cls.room} • {cls.teacher}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-medium ${idx === 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {cls.time}
                  </p>
                  {idx === 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Now
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Recent Grades
            </CardTitle>
            <Link to="/student/grades">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : recentGrades.length > 0 ? (
              <div className="space-y-2">
                {recentGrades.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {item.subjects?.name || "Unknown Subject"}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.total_score || 0}%</p>
                    </div>
                    <GradeBadge grade={item.letter_grade || "N/A"} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No grades available yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: "View Grades", href: "/student/grades", color: "text-primary" },
            { icon: FileText, label: "Download Report", href: "/student/reports", color: "text-emerald-500" },
            { icon: Calendar, label: "Schedule", href: "/student/schedule", color: "text-amber-500" },
            { icon: MessageCircle, label: "Messages", href: "/student/settings", color: "text-blue-500" },
          ].map((action, idx) => (
            <Link key={idx} to={action.href}>
              <Card className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-2 rounded-lg bg-secondary">
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
