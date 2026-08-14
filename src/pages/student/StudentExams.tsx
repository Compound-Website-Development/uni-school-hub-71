import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Monitor, Clock, Play, CheckCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";

const StudentExams = () => {
  const { studentData } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      if (!studentData?.id) return;
      const [{ data: examData }, { data: subData }] = await Promise.all([
        supabase.from("exams").select("*, subjects(name), classes(name)").eq("status", "active"),
        supabase.from("exam_submissions").select("*").eq("student_id", studentData.id),
      ]);
      setExams(examData || []);
      setSubmissions(subData || []);
      setIsLoading(false);
    };
    fetchExams();
  }, [studentData]);

  const getSubmission = (examId: string) => submissions.find(s => s.exam_id === examId);

  return (
    <StudentLayout title="Examinations">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CBT Examinations</h1>
          <p className="text-muted-foreground text-sm mt-1">Take your computer-based tests here</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl skeleton" />)}
          </div>
        ) : exams.length === 0 ? (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardContent className="p-12 text-center">
              <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground">No Active Exams</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for upcoming examinations.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => {
              const sub = getSubmission(exam.id);
              const isCompleted = sub?.submitted_at;
              return (
                <Card key={exam.id} className="rounded-xl border-border/50 shadow-card card-hover-subtle">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg shrink-0 ${isCompleted ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{exam.title}</h3>
                          <p className="text-sm text-muted-foreground">{(exam as any).subjects?.name || "General"} • {(exam as any).classes?.name || ""}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration_minutes} min</span>
                            {exam.end_time && <span>Due: {format(new Date(exam.end_time), "MMM d, h:mm a")}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isCompleted ? (
                          <div>
                            <Badge className="bg-success/10 text-success border-0">Completed</Badge>
                            {sub.score !== null && <p className="text-lg font-bold text-foreground mt-1">{sub.score}%</p>}
                          </div>
                        ) : sub ? (
                          <Button onClick={() => navigate(`/student/exams/${exam.id}`)} size="sm" className="bg-warning text-warning-foreground">
                            <Play className="w-4 h-4 mr-1" /> Resume
                          </Button>
                        ) : (
                          <Button onClick={() => navigate(`/student/exams/${exam.id}`)} size="sm">
                            <Play className="w-4 h-4 mr-1" /> Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Past Results */}
        {submissions.filter(s => s.submitted_at).length > 0 && (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Past Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {submissions.filter(s => s.submitted_at).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <p className="text-sm font-medium text-foreground">Exam Submission</p>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{s.score !== null ? `${s.score}%` : "Pending"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(s.submitted_at), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentExams;
