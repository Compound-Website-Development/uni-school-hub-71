import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Loader2, Calendar, CheckCircle, Search, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const StudentHomework = () => {
  const { studentData } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const query = supabase.from("assignments").select("*, classes(name), subjects(name)").order("due_date", { ascending: true });
      const { data: a } = studentData?.class_id ? await query.eq("class_id", studentData.class_id) : await query;
      setAssignments(a || []);
      if (studentData) {
        const { data: s } = await supabase.from("assignment_submissions").select("*").eq("student_id", studentData.id);
        setSubmissions(s || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [studentData]);

  const submissionFor = (id: string) => submissions.find((s: any) => s.assignment_id === id);

  const matches = (a: any) =>
    !search.trim() ||
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    (a.subjects?.name || "").toLowerCase().includes(search.toLowerCase());

  const visible = assignments.filter(matches);
  const pending = visible.filter((a) => !submissionFor(a.id));
  const submitted = visible.filter((a) => submissionFor(a.id));

  const dueState = (a: any) => {
    if (!a.due_date) return { label: "Pending", tone: "bg-muted text-muted-foreground", icon: Clock, overdue: false };
    const due = new Date(a.due_date).getTime();
    const diff = due - Date.now();
    if (diff < 0) return { label: "Overdue", tone: "bg-destructive/10 text-destructive", icon: AlertCircle, overdue: true };
    if (diff < 1000 * 60 * 60 * 48) return { label: "Due Soon", tone: "bg-warning/15 text-warning", icon: Clock, overdue: false };
    return { label: "Pending", tone: "bg-muted text-muted-foreground", icon: Clock, overdue: false };
  };

  const AssignmentCard = ({ a }: { a: any }) => {
    const sub = submissionFor(a.id);
    const state = dueState(a);
    const StateIcon = state.icon;
    return (
      <Card className="rounded-2xl border-border/50 shadow-card hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {a.subjects?.name || "General"}
            </span>
            {sub ? (
              <Badge className="bg-success/10 text-success border-0 gap-1 text-[11px]">
                <CheckCircle className="w-3 h-3" /> Submitted
              </Badge>
            ) : (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", state.tone)}>
                <StateIcon className="w-3 h-3" /> {state.label}
              </span>
            )}
          </div>
          <h3 className="font-bold text-foreground mt-2">{a.title}</h3>
          <p className={cn("text-xs mt-1 flex items-center gap-1.5", state.overdue && !sub ? "text-destructive" : "text-muted-foreground")}>
            <Calendar className="w-3.5 h-3.5" />
            {a.due_date ? new Date(a.due_date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No due date"}
          </p>
          {sub?.score != null && (
            <p className="text-xs mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5">
              <strong>Score:</strong> {sub.score}
              {a.max_score ? `/${a.max_score}` : ""} {sub.feedback ? `· ${sub.feedback}` : ""}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button asChild variant="ghost" size="sm" className="text-primary">
              <Link to={`/student/homework/${a.id}`}>View Details</Link>
            </Button>
            {!sub && (
              <Button asChild size="sm" className="shadow-md">
                <Link to={`/student/homework/${a.id}`}>{state.overdue ? "Submit Late" : "Submit Now"}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <StudentLayout title="Homework">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  const empty = (label: string) => (
    <Card className="rounded-2xl">
      <CardContent className="p-8 text-center">
        <ClipboardList className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <StudentLayout title="Homework">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Homework</h1>
          <p className="text-sm text-muted-foreground mt-1">Track, open and submit your assignments</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="pending" className="flex-1 rounded-lg">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="submitted" className="flex-1 rounded-lg">Submitted ({submitted.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 mt-4">
            {pending.length === 0 ? empty("Nothing pending. Great work!") : pending.map((a) => <AssignmentCard key={a.id} a={a} />)}
          </TabsContent>
          <TabsContent value="submitted" className="space-y-3 mt-4">
            {submitted.length === 0 ? empty("No submissions yet.") : submitted.map((a) => <AssignmentCard key={a.id} a={a} />)}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default StudentHomework;
