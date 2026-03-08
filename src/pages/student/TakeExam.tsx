import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const TakeExam = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { studentData } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId || !studentData?.id) return;

      const [{ data: examData }, { data: questionData }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).single(),
        supabase.from("exam_questions").select("id, question_text, options, points").eq("exam_id", examId),
      ]);

      if (!examData) { navigate("/student/exams"); return; }
      setExam(examData);
      setQuestions(questionData || []);
      setTimeLeft(examData.duration_minutes * 60);

      // Create or resume submission
      const { data: existingSub } = await supabase
        .from("exam_submissions")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", studentData.id)
        .maybeSingle();

      if (existingSub) {
        if (existingSub.submitted_at) { navigate("/student/exams"); return; }
        setSubmissionId(existingSub.id);
        setAnswers(typeof existingSub.answers === "object" && existingSub.answers ? existingSub.answers as Record<string, number> : {});
      } else {
        const { data: newSub } = await supabase
          .from("exam_submissions")
          .insert({ exam_id: examId, student_id: studentData.id, answers: {} })
          .select()
          .single();
        if (newSub) setSubmissionId(newSub.id);
      }
    };
    fetchExam();
  }, [examId, studentData, navigate]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !submissionId) return;
    setIsSubmitting(true);

    // Calculate score
    let totalPoints = 0;
    let earned = 0;
    questions.forEach(q => {
      totalPoints += q.points || 1;
      // We need correct_index but we excluded it from student query
      // Score will be calculated server-side in a real app
    });

    await supabase
      .from("exam_submissions")
      .update({ answers, submitted_at: new Date().toISOString() })
      .eq("id", submissionId);

    toast.success("Exam submitted successfully!");
    navigate("/student/exams");
  }, [isSubmitting, submissionId, answers, questions, navigate]);

  // Auto-save answers
  useEffect(() => {
    if (!submissionId || Object.keys(answers).length === 0) return;
    const timeout = setTimeout(() => {
      supabase
        .from("exam_submissions")
        .update({ answers })
        .eq("id", submissionId);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [answers, submissionId]);

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const question = questions[currentQ];
  const options = Array.isArray(question?.options) ? question.options : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-foreground text-sm md:text-base">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm",
            timeLeft < 300 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
          )}>
            <Clock className="w-4 h-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Question */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Q{currentQ + 1}</Badge>
              <span className="text-xs text-muted-foreground">{question.points || 1} point(s)</span>
            </div>
            <CardTitle className="text-lg mt-2">{question.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {options.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setAnswers(prev => ({ ...prev, [question.id]: idx }))}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all text-sm",
                    answers[question.id] === idx
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-xs font-bold",
                    answers[question.id] === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(idx)}
              className={cn(
                "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                idx === currentQ ? "bg-primary text-primary-foreground" :
                answers[q.id] !== undefined ? "bg-success/20 text-success" :
                "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          {currentQ === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-success text-success-foreground hover:bg-success/90">
              <Send className="w-4 h-4 mr-1" /> Submit Exam
            </Button>
          ) : (
            <Button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Warning */}
        {timeLeft < 300 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Less than 5 minutes remaining! Your exam will auto-submit when time runs out.
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeExam;
