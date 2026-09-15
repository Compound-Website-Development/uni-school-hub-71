import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, SectionHeader, Figure, FigureGrid, UnderlineTabs, EmptyState } from "@/components/student/editorial";
import { cn } from "@/lib/utils";

interface Grade {
  id: string;
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
  subjects: { name: string } | null;
  terms: { id: string; name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { id: string; name: string } | null;
}

const StudentGrades = () => {
  const { studentData } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState<string>("");

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentData?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            id, continuous_assessment, exam_score, total_score, letter_grade, remark,
            subjects (name), terms (id, name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false });

        if (gradesData) setGrades(gradesData as any);

        const { data: results } = await supabase
          .from("term_results")
          .select(`gpa, class_position, class_size, terms (id, name)`)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (results) setTermResults(results as any);

        const { data: currentTerm } = await supabase
          .from("terms")
          .select("id")
          .eq("is_current", true)
          .maybeSingle();

        if (currentTerm) setActiveTerm(currentTerm.id);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [studentData?.id]);

  const terms = Array.from(
    new Map(
      grades
        .filter((g) => g.terms?.id)
        .map((g) => [g.terms!.id, { value: g.terms!.id, label: g.terms!.name }]),
    ).values(),
  );

  const selectedTerm = terms.some((t) => t.value === activeTerm) ? activeTerm : terms[0]?.value || "";
  const termGrades = grades.filter((g) => g.terms?.id === selectedTerm);
  const termResult = termResults.find((tr) => tr.terms?.id === selectedTerm) || termResults[0];

  const average = termGrades.length
    ? Math.round(termGrades.reduce((s, g) => s + Number(g.total_score || 0), 0) / termGrades.length)
    : null;
  const cumulativeGpa = termResults.length
    ? termResults.reduce((sum, tr) => sum + (tr.gpa || 0), 0) / termResults.length
    : null;

  const gradeInk = (grade: string | null) =>
    grade === "F" ? "text-destructive" : grade === "A" || grade === "B" ? "text-foreground" : "text-muted-foreground";

  return (
    <StudentLayout title="My Results">
      <div className="mx-auto w-full max-w-3xl space-y-7 pb-4">
        <PageTitle
          eyebrow="Academic record"
          title="My Results"
          lede="Continuous assessment, examination score and grade for every subject, term by term."
          action={
            <Link to="/student/report-card" className="editorial-link hidden shrink-0 md:inline">
              Report card
            </Link>
          }
        />

        {loading ? (
          <Skeleton className="h-28 rounded-none" />
        ) : (
          <FigureGrid>
            <Figure className="px-4" value={average !== null ? average : "—"} unit={average !== null ? "%" : ""} caption="Term average" note={`${termGrades.length} subjects`} />
            <Figure className="px-4" value={termResult?.gpa != null ? termResult.gpa.toFixed(2) : "—"} caption="Term GPA" note="Published result" />
            <Figure className="px-4" value={cumulativeGpa != null ? cumulativeGpa.toFixed(2) : "—"} caption="Cumulative" note={`${termResults.length} terms`} />
            <Figure
              className="px-4"
              value={termResult?.class_position ?? "—"}
              unit={termResult?.class_size ? `/${termResult.class_size}` : ""}
              caption="Class position"
              note={termResult?.class_size ? "Ranked" : "Not published"}
            />
          </FigureGrid>
        )}

        {terms.length > 1 && (
          <UnderlineTabs value={selectedTerm} onChange={setActiveTerm} options={terms} />
        )}

        <section>
          <SectionHeader title="Subject ledger" right={<span className="editorial-eyebrow">CA · Exam · Total · Grade</span>} />
          {loading ? (
            <div className="space-y-2 pt-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-none" />)}
            </div>
          ) : termGrades.length ? (
            <table className="w-full border-b border-foreground/10 text-left">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Subject</th>
                  <th className="w-12 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">CA</th>
                  <th className="w-14 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Exam</th>
                  <th className="w-14 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total</th>
                  <th className="w-10 py-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Gr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {termGrades.map((g) => (
                  <tr key={g.id} className="align-baseline">
                    <td className="py-3 pr-2">
                      <p className="text-[15px] font-semibold text-foreground">{g.subjects?.name || "Subject"}</p>
                      {g.remark && <p className="mt-0.5 text-xs text-muted-foreground">{g.remark}</p>}
                    </td>
                    <td className="num py-3 text-right text-sm text-muted-foreground">{g.continuous_assessment ?? "—"}</td>
                    <td className="num py-3 text-right text-sm text-muted-foreground">{g.exam_score ?? "—"}</td>
                    <td className="num py-3 text-right text-[15px] font-semibold text-foreground">{g.total_score ?? "—"}</td>
                    <td className={cn("num py-3 text-right text-[15px] font-bold", gradeInk(g.letter_grade))}>
                      {g.letter_grade || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No scores for this term" hint="Results appear once your teachers publish them." />
          )}
        </section>

        <Link to="/student/report-card" className="editorial-link inline-block md:hidden">
          Open report card
        </Link>
      </div>
    </StudentLayout>
  );
};

export default StudentGrades;
