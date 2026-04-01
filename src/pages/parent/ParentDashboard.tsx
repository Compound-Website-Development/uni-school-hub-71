import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, BookOpen, Calendar, CreditCard, Loader2,
  TrendingUp, Clock, MessageSquare, Bell, ChevronRight, Star,
  ClipboardList, Monitor, AlertTriangle
} from "lucide-react";
import { format, isFuture, isToday, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [childGrades, setChildGrades] = useState<Record<string, any[]>>({});
  const [childAttendance, setChildAttendance] = useState<Record<string, { present: number; total: number }>>({});
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingHomework, setUpcomingHomework] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      if (links && links.length > 0) {
        const studentIds = links.map((l: any) => l.student_id);

        // Get student class_ids for homework/exam queries
        const [studentsRes, gradesRes, attendanceRes, announcementsRes] = await Promise.all([
          supabase.from("students").select("*").in("id", studentIds),
          supabase.from("grades").select("student_id, total_score, letter_grade, subjects(name)").in("student_id", studentIds),
          supabase.from("attendance").select("student_id, status").in("student_id", studentIds),
          supabase.from("announcements").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(5),
        ]);

        const studentList = studentsRes.data || [];
        setChildren(studentList);
        setRecentAnnouncements(announcementsRes.data || []);

        // Fetch upcoming homework and exams based on children's classes
        const classIds = studentList.map((s: any) => s.class_id).filter(Boolean);
        if (classIds.length > 0) {
          const [hwRes, examRes] = await Promise.all([
            supabase.from("assignments").select("title, due_date, subjects(name)").in("class_id", classIds).gte("due_date", new Date().toISOString()).order("due_date").limit(5),
            supabase.from("exams").select("title, start_time, duration_minutes, subjects(name)").in("class_id", classIds).in("status", ["active", "draft"]).order("start_time").limit(5),
          ]);
          setUpcomingHomework(hwRes.data || []);
          setUpcomingExams(examRes.data || []);
        }

        // Process grades per child
        const gradeMap: Record<string, any[]> = {};
        (gradesRes.data || []).forEach((g: any) => {
          if (!gradeMap[g.student_id]) gradeMap[g.student_id] = [];
          gradeMap[g.student_id].push(g);
        });
        setChildGrades(gradeMap);

        // Process attendance per child
        const attMap: Record<string, { present: number; total: number }> = {};
        studentIds.forEach((sid: string) => {
          const records = (attendanceRes.data || []).filter((a: any) => a.student_id === sid);
          attMap[sid] = {
            total: records.length,
            present: records.filter((a: any) => a.status === "present").length,
          };
        });
        setChildAttendance(attMap);
      }
      setIsLoading(false);
    };
    fetchAll();
  }, [user]);

  const getAvgGrade = (studentId: string) => {
    const grades = childGrades[studentId] || [];
    if (grades.length === 0) return 0;
    return Math.round(grades.reduce((s: number, g: any) => s + Number(g.total_score || 0), 0) / grades.length);
  };

  const getAttendanceRate = (studentId: string) => {
    const att = childAttendance[studentId];
    if (!att || att.total === 0) return 100;
    return Math.round((att.present / att.total) * 100);
  };

  if (isLoading) {
    return (
      <ParentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div className="premium-card p-5">
          <h2 className="text-xl font-bold text-foreground">Welcome Back 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor your child's progress in real-time</p>
        </div>

        {children.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-foreground mb-2">No Children Linked</h3>
              <p className="text-sm text-muted-foreground">Contact the school administrator to link your child's account.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Child Cards with Stats */}
            {children.map((child) => {
              const avg = getAvgGrade(child.id);
              const att = getAttendanceRate(child.id);
              return (
                <Card key={child.id} className="border-border/50 overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      {child.first_name} {child.last_name}
                      <Badge variant="outline" className="ml-auto capitalize text-[10px]">{child.status || "active"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <Star className="w-4 h-4 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold text-foreground">{avg}%</p>
                        <p className="text-[10px] text-muted-foreground">Avg Grade</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-info" />
                        <p className="text-lg font-bold text-foreground">{att}%</p>
                        <p className="text-[10px] text-muted-foreground">Attendance</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-success" />
                        <p className="text-lg font-bold text-foreground">{(childGrades[child.id] || []).length}</p>
                        <p className="text-[10px] text-muted-foreground">Subjects</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Academic Performance</span>
                        <span className={`font-semibold ${avg >= 60 ? "text-success" : avg >= 40 ? "text-warning" : "text-destructive"}`}>{avg >= 60 ? "Good" : avg >= 40 ? "Average" : "Needs Attention"}</span>
                      </div>
                      <Progress value={avg} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Upcoming Homework & Exams */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-warning" /> Upcoming Homework
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingHomework.length > 0 ? (
                <div className="space-y-2">
                  {upcomingHomework.map((hw, i) => {
                    const due = new Date(hw.due_date);
                    const isUrgent = due <= addDays(new Date(), 2);
                    return (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">{hw.title}</p>
                          <p className="text-[10px] text-muted-foreground">{(hw as any).subjects?.name || "General"}</p>
                        </div>
                        <Badge className={`text-[10px] ${isUrgent ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {isToday(due) ? "Today" : format(due, "MMM d")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No upcoming homework</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-info" /> Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length > 0 ? (
                <div className="space-y-2">
                  {upcomingExams.map((exam, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{exam.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(exam as any).subjects?.name || "General"} · {exam.duration_minutes}min
                        </p>
                      </div>
                      <Badge className="text-[10px] bg-info/10 text-info border-info/20">
                        {exam.start_time ? format(new Date(exam.start_time), "MMM d") : "TBA"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Monitor className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No upcoming exams</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, label: "View Grades", href: "/parent/grades", color: "text-primary bg-primary/10" },
            { icon: Calendar, label: "Attendance", href: "/parent/attendance", color: "text-info bg-info/10" },
            { icon: CreditCard, label: "Fee Status", href: "/parent/fees", color: "text-success bg-success/10" },
            { icon: MessageSquare, label: "Messages", href: "/parent/messages", color: "text-accent bg-accent/10" },
          ].map((item, idx) => (
            <button key={idx} onClick={() => navigate(item.href)} className="text-left">
              <Card className="border-border/50 card-hover-subtle">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">{item.label} <ChevronRight className="w-3 h-3 text-muted-foreground" /></p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Recent Announcements */}
        {recentAnnouncements.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Recent Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      {a.priority === "high" && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Important</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : ""}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ParentLayout>
  );
};

export default ParentDashboard;
