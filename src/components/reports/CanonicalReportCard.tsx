import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import ReportCardEditor, { ReportCardData } from "@/components/reports/ReportCardEditor";
import { loadReportCard, StudentOption, SubjectOption, TermOption } from "@/lib/reportCards";
import { SCHOOL } from "@/lib/schoolConfig";

/**
 * The one read-only surface for the school's official report card.
 * Same loader (`loadReportCard`) and same sheet (`ReportCardEditor`) the Staff
 * Portal builder uses — student and parent views must never re-implement it.
 */
interface Props {
  /** students.id of the pupil whose sheet should be shown. */
  studentId?: string | null;
  /** Only reveal terms whose term_results row has been published (pupil/parent view). */
  requirePublished?: boolean;
}

export const CanonicalReportCard = ({ studentId, requirePublished = true }: Props) => {
  const [student, setStudent] = useState<StudentOption | null>(null);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [termId, setTermId] = useState("");
  const [sheet, setSheet] = useState<Partial<ReportCardData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [studentRes, termRes, subjectRes, classRes, publishedRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, student_id, first_name, last_name, middle_name, gender, date_of_birth, class_id")
          .eq("id", studentId)
          .maybeSingle(),
        supabase.from("terms").select("id, name, session, is_current").order("created_at"),
        supabase.from("subjects").select("id, name").order("name"),
        supabase.from("classes").select("id, name").order("name"),
        supabase.from("term_results").select("term_id, is_published").eq("student_id", studentId),
      ]);
      if (cancelled) return;

      const published = new Set(
        (publishedRes.data || []).filter((r: any) => r.is_published).map((r: any) => r.term_id),
      );
      const allTerms = (termRes.data || []) as TermOption[];
      const visible = requirePublished ? allTerms.filter((t) => published.has(t.id)) : allTerms;

      setStudent((studentRes.data as StudentOption) ?? null);
      setSubjects((subjectRes.data || []) as SubjectOption[]);
      setClasses((classRes.data || []) as { id: string; name: string }[]);
      setTerms(visible);
      setTermId((visible.find((t) => t.is_current) || visible[0])?.id ?? "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [studentId, requirePublished]);

  const term = useMemo(() => terms.find((t) => t.id === termId), [terms, termId]);

  useEffect(() => {
    if (!student || !termId) {
      setSheet(undefined);
      return;
    }
    let cancelled = false;
    setLoadingSheet(true);
    loadReportCard(student, termId, subjects, classes).then((d) => {
      if (cancelled) return;
      setSheet({ ...d, term: term?.name || "", year: term?.session || SCHOOL.session });
      setLoadingSheet(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, termId, subjects.length, classes.length]);

  if (loading) return <Skeleton className="h-72 rounded-2xl" />;

  if (!studentId || !student) {
    return (
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No pupil record is linked to this account yet, so no report card can be shown.
        </CardContent>
      </Card>
    );
  }

  if (terms.length === 0) {
    return (
      <Card className="rounded-2xl border-border/60">
        <CardContent className="p-8 text-center space-y-2">
          <Badge variant="secondary">Awaiting publication</Badge>
          <p className="text-sm text-muted-foreground">
            The school has not published a report card for {student.first_name} yet. It appears here the moment
            the class teacher publishes it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="text-sm text-muted-foreground">
          Official school sheet — issued by {student.first_name}&apos;s class teacher.
        </div>
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger className="w-52 rounded-xl"><SelectValue placeholder="Select term" /></SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}{t.session ? ` — ${t.session}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadingSheet ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <ReportCardEditor key={`${student.id}-${termId}`} readOnly initial={sheet} />
      )}
    </div>
  );
};

export default CanonicalReportCard;
