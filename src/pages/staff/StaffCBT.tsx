import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { Monitor, Plus, Clock, Users, Trash2, Eye, Download, ClipboardList } from "lucide-react";
import { format } from "date-fns";

const StaffCBT = () => {
  const isAdminView = useLocation().pathname.startsWith("/admin/");
  const PageLayout = isAdminView ? AdminLayout : StaffLayout;
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Create form
  const [newExam, setNewExam] = useState({
    title: "", subject_id: "", class_id: "", duration_minutes: 60, start_time: "", end_time: "", delivery_mode: "desktop_offline",
  });
  const [newQuestion, setNewQuestion] = useState({
    question_text: "", options: ["", "", "", ""], correct_index: 0, points: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: examData }, { data: subData }, { data: classData }] = await Promise.all([
        supabase.from("exams").select("*, subjects(name), classes(name, arm)").order("created_at", { ascending: false }),
        supabase.from("subjects").select("id, name"),
        supabase.from("classes").select("id, name, arm"),
      ]);
      setExams(examData || []);
      setSubjects(subData || []);
      setClasses(classData || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateExam = async () => {
    if (!newExam.title || !newExam.subject_id || !newExam.class_id) { toast.error("Title, subject and class/arm are required."); return; }
    if (!newExam.start_time || !newExam.end_time || new Date(newExam.end_time) <= new Date(newExam.start_time)) { toast.error("Set a valid exam start and end window."); return; }
    if (!Number.isInteger(Number(newExam.duration_minutes)) || Number(newExam.duration_minutes) < 1 || Number(newExam.duration_minutes) > 300) { toast.error("Duration must be between 1 and 300 minutes."); return; }
    const { data, error } = await supabase.from("exams").insert({
      ...newExam,
      duration_minutes: Number(newExam.duration_minutes),
      start_time: new Date(newExam.start_time).toISOString(),
      end_time: new Date(newExam.end_time).toISOString(),
      created_by: user?.id,
      status: "draft",
      is_published: false,
      delivery_mode: newExam.delivery_mode,
    }).select("*, subjects(name), classes(name, arm)").single();

    if (error) { toast.error("Failed to create exam"); return; }
    setExams(prev => [data, ...prev]);
    setShowCreate(false);
    setNewExam({ title: "", subject_id: "", class_id: "", duration_minutes: 60, start_time: "", end_time: "", delivery_mode: "desktop_offline" });
    toast.success("Exam created!");
  };

  const handleAddQuestion = async () => {
    if (!selectedExam || !newQuestion.question_text.trim()) { toast.error("Enter the question text."); return; }
    if (newQuestion.options.some(o => !o.trim())) { toast.error("Fill all four answer options before adding the question."); return; }
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
    setShowResults(false);
    const { data } = await supabase.from("exam_questions").select("*").eq("exam_id", exam.id);
    setQuestions(data || []);
  };

  const toggleExamStatus = async (exam: any) => {
    const newStatus = exam.status === "active" ? "draft" : "active";
    if (newStatus === "active") {
      if (!exam.subject_id || !exam.class_id || !exam.start_time || !exam.end_time || new Date(exam.end_time) <= new Date(exam.start_time)) { toast.error("Set the subject, class/arm and valid exam window before publishing."); return; }
      const { count, error: countError } = await supabase.from("exam_questions").select("id", { count: "exact", head: true }).eq("exam_id", exam.id);
      if (countError || !count) { toast.error("Add at least one objective question before publishing."); return; }
    }
    const { error: updateError } = await supabase.from("exams").update({ status: newStatus, is_published: newStatus === "active" }).eq("id", exam.id);
    if (updateError) { toast.error("Could not update exam publication status."); return; }
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: newStatus, is_published: newStatus === "active" } : e));
    setSelectedExam((prev: any) => prev?.id === exam.id ? { ...prev, status: newStatus, is_published: newStatus === "active" } : prev);
    toast.success(`Exam ${newStatus === "active" ? "activated" : "deactivated"}!`);
  };

  const downloadDesktopPackage = async (exam: any) => {
    if (exam.delivery_mode !== "desktop_offline") { toast.error("This exam is configured for browser practice, not the Windows CBT station."); return; }
    if (exam.status !== "active" && !exam.is_published) { toast.error("Publish the exam before downloading its desktop package."); return; }
    const { data, error } = await supabase.functions.invoke("cbt-exam-package", { body: { examId: exam.id } });
    if (error || !data?.payload || !data?.signature || !data?.packageHash) { toast.error(data?.error || error?.message || "Could not prepare the signed exam package."); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = (exam.title || "imagemakers-exam").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".imexam";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Signed desktop exam package downloaded.");
  };

  const viewExamResults = async (exam: any) => {
    setSelectedExam(exam);
    setShowResults(true);
    const { data, error } = await supabase.from("exam_submissions")
      .select("id, score, submitted_at, students(first_name, middle_name, last_name, student_id, class_id, classes(name, arm))")
      .eq("exam_id", exam.id).not("submitted_at", "is", null).order("submitted_at", { ascending: false });
    if (error) { toast.error("Could not load results for this exam."); return; }
    setSubmissions(data || []);
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
    <PageLayout title="CBT Practice & Revision Studio">

      <div className="dashboard-surface dashboard-staff space-y-6 animate-fade-in">
        <section className="portal-hero">
          <div className="staff-art staff-art-cbt hidden md:block" aria-hidden="true"><span/><i/><b/></div>
          <div className="portal-hero-copy">
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Assessment studio</p>
            <h1 className="portal-display mt-2 text-4xl font-extrabold md:text-5xl">Prepare exams for the Windows CBT station.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Create objective papers for browser practice or the standalone offline Windows CBT station. Offline exams are assigned to a class/arm and subject, scheduled, published and exported as signed exam packages.</p>
          </div>
          <div className="flex justify-end"><Dialog open={showCreate} onOpenChange={setShowCreate}>
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
                <div>
                  <Label>Delivery platform</Label>
                  <Select value={newExam.delivery_mode} onValueChange={v => setNewExam({ ...newExam, delivery_mode: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose delivery platform" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop_offline">Official supervised Windows CBT</SelectItem>
                      <SelectItem value="web_practice">Browser practice and revision</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.arm ? ` · ${c.arm}` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min="1" max="300" value={newExam.duration_minutes} onChange={e => setNewExam({ ...newExam, duration_minutes: parseInt(e.target.value) || 60 })} />
                </div>
                <div>
                  <Label>Exam opens</Label>
                  <Input type="datetime-local" value={newExam.start_time} onChange={e => setNewExam({ ...newExam, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>Exam closes</Label>
                  <Input type="datetime-local" value={newExam.end_time} onChange={e => setNewExam({ ...newExam, end_time: e.target.value })} />
                </div>
                <Button onClick={handleCreateExam} className="w-full">Create Exam</Button>
              </div>
            </DialogContent>
          </Dialog></div>
        </section>

        {/* Exam List or Question Editor */}
        {selectedExam ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => setSelectedExam(null)} className="mb-2">← Back to Exams</Button>
                <h2 className="text-xl font-bold text-foreground">{selectedExam.title}</h2>
                <p className="text-sm text-muted-foreground">{questions.length} questions</p>
              </div>
              <div className="flex gap-2"><Button variant="outline" onClick={() => viewExamResults(selectedExam)}><ClipboardList className="w-4 h-4 mr-1"/> Results</Button>{selectedExam.status === "active" && selectedExam.delivery_mode === "desktop_offline" && <Button onClick={() => downloadDesktopPackage(selectedExam)}><Download className="w-4 h-4 mr-1"/> Download Windows package</Button>}<Button onClick={() => toggleExamStatus(selectedExam)}>
                {selectedExam.status === "active" ? "Unpublish" : "Publish"}
              </Button></div>
            </div>

            {showResults ? <Card className="rounded-xl border-border/50"><CardHeader><CardTitle className="text-sm">Results — {submissions.length} submitted attempts</CardTitle></CardHeader><CardContent>{submissions.length === 0 ? <p className="text-sm text-muted-foreground">No completed submissions have synced for this exam yet.</p> : <div className="space-y-3">{submissions.map((row: any) => { const student = Array.isArray(row.students) ? row.students[0] : row.students; const klass = Array.isArray(student?.classes) ? student.classes[0] : student?.classes; return <div key={row.id} className="flex items-center justify-between gap-4 border-b border-border/50 py-3"><div><p className="text-sm font-medium">{[student?.first_name,student?.middle_name,student?.last_name].filter(Boolean).join(" ") || "Candidate"}</p><p className="text-xs text-muted-foreground">{student?.student_id || "No admission number"} · {klass?.name || "Class"} {klass?.arm || ""}</p></div><div className="text-right"><p className="font-semibold">{row.score ?? "Pending"} marks</p><p className="text-xs text-muted-foreground">{row.submitted_at ? format(new Date(row.submitted_at),"MMM d, yyyy h:mm a") : ""}</p></div></div>; })}</div>}</CardContent></Card> : null}

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
                        <p className="text-sm text-muted-foreground">{(exam as any).subjects?.name || "No subject"} • {(exam as any).classes?.name || "All classes"} {(exam as any).classes?.arm ? `· ${(exam as any).classes.arm}` : ""}</p>
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
                      {exam.status === "active" && exam.delivery_mode === "desktop_offline" && <Button variant="outline" size="sm" onClick={() => downloadDesktopPackage(exam)}><Download className="w-4 h-4 mr-1"/> Package</Button>}
                      <Button variant="ghost" size="sm" onClick={() => viewExamResults(exam)}><ClipboardList className="w-4 h-4 mr-1"/> Results</Button>
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
    </PageLayout>
  );
};

export default StaffCBT;
