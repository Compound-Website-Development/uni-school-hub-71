import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Send, Loader2, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StudentHomework = () => {
  const { studentData } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitText, setSubmitText] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: a } = await supabase.from("assignments").select("*, classes(name), subjects(name)").order("due_date", { ascending: false });
      setAssignments(a || []);
      if (studentData) {
        const { data: s } = await supabase.from("assignment_submissions").select("*").eq("student_id", studentData.id);
        setSubmissions(s || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [studentData]);

  const handleSubmit = async (assignmentId: string) => {
    const content = submitText[assignmentId];
    if (!content?.trim() || !studentData) return;
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: assignmentId, student_id: studentData.id, content,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Submitted!" });
    setSubmitText({ ...submitText, [assignmentId]: "" });
    const { data: s } = await supabase.from("assignment_submissions").select("*").eq("student_id", studentData.id);
    setSubmissions(s || []);
  };

  const isSubmitted = (id: string) => submissions.some((s: any) => s.assignment_id === id);
  const getSubmission = (id: string) => submissions.find((s: any) => s.assignment_id === id);

  if (isLoading) {
    return <StudentLayout title="Homework"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StudentLayout>;
  }

  return (
    <StudentLayout title="Homework & Assignments">
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-xl font-bold">My Assignments</h2>
        {assignments.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><ClipboardList className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No assignments yet.</p></CardContent></Card>
        ) : assignments.map((a) => {
          const submitted = isSubmitted(a.id);
          const sub = getSubmission(a.id);
          return (
            <Card key={a.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {submitted ? <Badge className="bg-success/10 text-success border-0"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge> : <Badge variant="outline">Pending</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{a.description || "No instructions"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due: {new Date(a.due_date).toLocaleDateString()}</span>
                  {a.subjects?.name && <Badge variant="secondary" className="text-xs">{a.subjects.name}</Badge>}
                </div>
                {submitted && sub?.grade != null && (
                  <div className="p-2 rounded bg-muted/30 mb-2">
                    <p className="text-sm"><strong>Grade:</strong> {sub.grade}% {sub.feedback && `· ${sub.feedback}`}</p>
                  </div>
                )}
                {!submitted && (
                  <div className="space-y-2">
                    <Textarea placeholder="Write your answer..." value={submitText[a.id] || ""} onChange={(e) => setSubmitText({ ...submitText, [a.id]: e.target.value })} rows={3} />
                    <Button size="sm" onClick={() => handleSubmit(a.id)} disabled={!submitText[a.id]?.trim()}>
                      <Send className="w-4 h-4 mr-2" /> Submit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </StudentLayout>
  );
};

export default StudentHomework;
