import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, UnderlineTabs, RuleList, EmptyState, StatusWord } from "@/components/student/editorial";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const StudentHomework = () => {
  const { studentData } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "submitted">("pending");

  useEffect(() => {
    const fetchData = async () => {
      const query = supabase
        .from("assignments")
        .select("*, classes(name), subjects(name)")
        .order("due_date", { ascending: true });
      const { data: a } = studentData?.class_id ? await query.eq("class_id", studentData.class_id) : await query;
      setAssignments(a || []);
      if (studentData) {
        const { data: s } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", studentData.id);
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
  const rows = tab === "pending" ? pending : submitted;

  const dueState = (a: any) => {
    if (!a.due_date) return { label: "Pending", overdue: false };
    const diff = new Date(a.due_date).getTime() - Date.now();
    if (diff < 0) return { label: "Overdue", overdue: true };
    if (diff < 1000 * 60 * 60 * 48) return { label: "Due soon", overdue: false };
    return { label: "Pending", overdue: false };
  };

  return (
    <StudentLayout title="Homework">
      <div className="student-homework-page mx-auto w-full max-w-4xl space-y-6 pb-4">
        <PageTitle
          eyebrow="Assignments"
          title="Homework"
          lede="Open an assignment to read the brief and submit your work."
        />

        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("imagemakers-open-ai"))}
          className="homework-ai-prompt flex w-full items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#806ca5] shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-[#806ca5]">Need a hint?</span>
            <span className="mt-1 block text-sm font-bold text-[#38433c]">Ask the AI Tutor to explain the topic or walk you through a similar example.</span>
            <span className="mt-1 block text-xs text-muted-foreground">It helps you learn; it will not simply complete the homework for you.</span>
          </span>
          <span className="shrink-0 text-xs font-extrabold text-[#806ca5]">Open</span>
        </button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-none border-0 border-b border-foreground/15 bg-transparent pl-6 text-sm shadow-none focus-visible:border-foreground focus-visible:ring-0"
            placeholder="Search by title or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <UnderlineTabs
          value={tab}
          onChange={(v) => setTab(v as any)}
          options={[
            { value: "pending", label: `Pending (${pending.length})` },
            { value: "submitted", label: `Submitted (${submitted.length})` },
          ]}
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading assignments…</p>
        ) : rows.length ? (
          <RuleList>
            {rows.map((a) => {
              const sub = submissionFor(a.id);
              const state = dueState(a);
              return (
                <li key={a.id} className="py-4">
                  <p className="editorial-eyebrow">{a.subjects?.name || "General"}</p>
                  <div className="mt-1.5 flex items-start justify-between gap-4">
                    <h3 className="font-display min-w-0 text-lg font-bold leading-snug tracking-tight text-foreground">
                      {a.title}
                    </h3>
                    <StatusWord
                      className="mt-1 shrink-0"
                      label={sub ? "Submitted" : state.label}
                      tone={sub ? "ink" : state.overdue ? "alert" : "muted"}
                    />
                  </div>
                  <p className={cn("num mt-1 text-xs", state.overdue && !sub ? "text-destructive" : "text-muted-foreground")}>
                    {a.due_date
                      ? `Due ${new Date(a.due_date).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "No due date"}
                  </p>
                  {sub?.score != null && (
                    <p className="mt-2 border-l-2 border-foreground/20 pl-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Score {sub.score}
                        {a.max_score ? `/${a.max_score}` : ""}
                      </span>
                      {sub.feedback ? ` — ${sub.feedback}` : ""}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-5">
                    <Link to={`/student/homework/${a.id}`} className="editorial-link">
                      View details
                    </Link>
                    {!sub && (
                      <Link
                        to={`/student/homework/${a.id}`}
                        className="press bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-background"
                      >
                        {state.overdue ? "Submit late" : "Submit"}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </RuleList>
        ) : (
          <EmptyState
            title={tab === "pending" ? "Nothing pending" : "No submissions yet"}
            hint={tab === "pending" ? "You are fully up to date." : "Submitted work will be listed here."}
          />
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentHomework;
