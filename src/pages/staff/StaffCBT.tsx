import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Monitor, Plus, Clock, Users, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

const StaffCBT = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Create form
  const [newExam, setNewExam] = useState({
    title: "", subject_id: "", class_id: "", duration_minutes: 60,
  });
  const [newQuestion, setNewQuestion] = useState({
    question_text: "", options: ["", "", "", ""], correct_index: 0, points: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: examData }, { data: subData }, { data: classData }] = await Promise.all([
        supabase.from("exams").select("*, subjects(name), classes(name)").order("created_at", { ascending: false }),
        supabase.from("subjects").select("id, name"),
        supabase.from("classes").select("id, name"),
      ]);
      setExams(examData || []);
      setSubjects(subData || []);
      setClasses(classData || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateExam = async () => {
    if (!newExam.title) { toast.error("Title is required"); return; }
    const { data, error } = await supabase.from("exams").insert({
      ...newExam,
      subject_id: newExam.subject_id || null,
      class_id: newExam.class_id || null,
      created_by: user?.id,
    }).select("*, subjects(name), classes(name)").single();

    if (error) { toast.error("Failed to create exam"); return; }
    setExams(prev => [data, ...prev]);
    setShowCreate(false);
    setNewExam({ title: "", subject_id: "", class_id: "", duration_minutes: 60 });
    toast.success("Exam created!");
  };

  const handleAddQuestion = async () => {
    if (!selectedExam || !newQuestion.question_text) return;
    const { data, error } = await supabase.from("exam_questions").insert({
      exam_id: selectedExam.id,
      question_text: newQuestion.question_text,
      options: newQuestion.options.filter(o => o.trim()),
      correct_index: newQuestion.correct_index,
      points: newQuestion.points,
    }).select().single();

    if (error) { toast.error("Failed to add question"); return; }
    setQuestions(prev => [...prev, data]);
    setNewQuestion({ question_text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });
    toast.success("Question added!");
  };

  const viewExamQuestions = async (exam: any) => {
    setSelectedExam(exam);
    const { data } = await supabase.from("exam_questions").select("*").eq("exam_id", exam.id);
    setQuestions(data || []);
  };

  const toggleExamStatus = async (exam: any) => {
    const newStatus = exam.status === "active" ? "draft" : "active";
    await supabase.from("exams").update({ status: newStatus }).eq("id", exam.id);
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus } : e));
    toast.success(`Exam ${newStatus === "active" ? "activated" : "deactivated"}!`);
  };

  const deleteExam = async (examId: string) => {
    await supabase.from("exams").delete().eq("id", examId);
    setExams(prev => prev.filter(e => e.id !== examId));
    toast.success("Exam deleted");
  };

  const statusBadge: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-success/10 text-success",
    completed: "bg-primary/10 text-primary",
  };

  return (
    <StaffLayout title="CBT Management">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CBT Examinations</h1>
            <p className="text-muted-foreground text-sm mt-1">Create and manage computer-based tests</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Create Exam</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Exam</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} placeholder="e.g. Mid-Term Mathematics" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Subject</Label>
                    <Select value={newExam.subject_id} onValueChange={v => setNewExam({ ...newExam, subject_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Select value={newExam.class_id} onValueChange={v => setNewExam({ ...newExam, class_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={newExam.duration_minutes} onChange={e => setNewExam({ ...newExam, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <Button onClick={handleCreateExam} className="w-full">Create Exam</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Exam List or Question Editor */}
        {selectedExam ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => setSelectedExam(null)} className="mb-2">← Back to Exams</Button>
                <h2 className="text-xl font-bold text-foreground">{selectedExam.title}</h2>
                <p className="text-sm text-muted-foreground">{questions.length} questions</p>
              </div>
              <Button onClick={() => toggleExamStatus(selectedExam)}>
                {selectedExam.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </div>

            {/* Add Question */}
            <Card className="rounded-xl border-border/50 shadow-card">
              <CardHeader><CardTitle className="text-sm">Add Question</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea placeholder="Question text..." value={newQuestion.question_text} onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  {newQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={newQuestion.correct_index === idx}
                        onChange={() => setNewQuestion({ ...newQuestion, correct_index: idx })}
                        className="accent-primary"
                      />
                      <Input
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={e => {
                          const opts = [...newQuestion.options];
                          opts[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: opts });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleAddQuestion} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
              </CardContent>
            </Card>

            {/* Question List */}
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id} className="rounded-xl border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Q{idx + 1}. {q.question_text}</p>
                        <div className="mt-2 space-y-1">
                          {(Array.isArray(q.options) ? q.options : []).map((o: string, oi: number) => (
                            <p key={oi} className={`text-xs ${oi === q.correct_index ? "text-success font-bold" : "text-muted-foreground"}`}>
                              {String.fromCharCode(65 + oi)}. {o} {oi === q.correct_index && "✓"}
                            </p>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{q.points || 1} pt</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.length === 0 ? (
              <Card className="rounded-xl border-border/50 shadow-card">
                <CardContent className="p-12 text-center">
                  <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">No Exams Created</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first CBT exam to get started.</p>
                </CardContent>
              </Card>
            ) : exams.map(exam => (
              <Card key={exam.id} className="rounded-xl border-border/50 shadow-card card-hover-subtle">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{exam.title}</h3>
                          <Badge className={`${statusBadge[exam.status] || statusBadge.draft} border-0 text-xs`}>{exam.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{(exam as any).subjects?.name || "No subject"} • {(exam as any).classes?.name || "All classes"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration_minutes} min</span>
                          <span>{format(new Date(exam.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => viewExamQuestions(exam)}>
                        <Eye className="w-4 h-4 mr-1" /> Manage
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteExam(exam.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffCBT;
