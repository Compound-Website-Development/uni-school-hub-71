import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, CheckCircle, Loader2, Send, Target } from "lucide-react";

const StudentHomeworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { studentData } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: a } = await supabase.from("assignments").select("*, subjects(name), classes(name)").eq("id", id).maybeSingle();
      setAssignment(a);
      if (studentData?.id) {
        const { data: s } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("assignment_id", id)
          .eq("student_id", studentData.id)
          .maybeSingle();
        setSubmission(s);
      }
      setLoading(false);
    };
    load();
  }, [id, studentData?.id]);

  const handleSubmit = async () => {
    if (!content.trim() || !studentData || !id) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("assignment_submissions")
      .insert({ assignment_id: id, student_id: studentData.id, content })
      .select("*")
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    setSubmission(data);
    setContent("");
    toast({ title: "Submitted", description: "Your teacher has received your work." });
  };

  if (loading) {
    return (
      <StudentLayout title="Assignment">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </StudentLayout>
    );
  }

  if (!assignment) {
    return (
      <StudentLayout title="Assignment">
        <Card className="rounded-2xl"><CardContent className="p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">This assignment is no longer available.</p>
          <Button asChild variant="outline"><Link to="/student/homework">Back to Homework</Link></Button>
        </CardContent></Card>
      </StudentLayout>
    );
  }

  const overdue = assignment.due_date && new Date(assignment.due_date).getTime() < Date.now();

  return (
    <StudentLayout title="Assignment">
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <button onClick={() => navigate("/student/homework")} className="flex items-center gap-2 text-sm text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> Homework
        </button>

        <div>
          <Badge variant="secondary" className="text-xs">{assignment.subjects?.name || "General"}</Badge>
          <h1 className="text-2xl font-bold text-foreground mt-2">{assignment.title}</h1>
          <p className={`text-sm mt-1 flex items-center gap-1.5 ${overdue && !submission ? "text-destructive" : "text-muted-foreground"}`}>
            <Calendar className="w-4 h-4" />
            {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : "No due date"}
            {assignment.max_score ? ` • ${assignment.max_score} marks` : ""}
          </p>
        </div>

        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-5 space-y-2">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Instructions</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{assignment.description || "No instructions provided."}</p>
          </CardContent>
        </Card>

        {submission ? (
          <Card className="rounded-2xl shadow-card border-success/30">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-success font-semibold text-sm">
                <CheckCircle className="w-4 h-4" /> Submitted {new Date(submission.submitted_at || submission.created_at).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{submission.content}</p>
              {submission.score != null && (
                <div className="rounded-xl bg-muted/50 p-3 text-sm">
                  <strong>Score:</strong> {submission.score}{assignment.max_score ? `/${assignment.max_score}` : ""}
                  {submission.feedback && <p className="text-muted-foreground mt-1">{submission.feedback}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-5 space-y-3">
              <h2 className="font-semibold text-foreground">Your Submission</h2>
              <Textarea rows={6} placeholder="Write your answer..." value={content} onChange={(e) => setContent(e.target.value)} className="rounded-xl" />
              <Button onClick={handleSubmit} disabled={!content.trim() || saving} className="w-full shadow-md">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {overdue ? "Submit Late" : "Submit Now"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentHomeworkDetail;
