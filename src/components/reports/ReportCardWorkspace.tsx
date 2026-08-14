import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ReportCardEditor, { ReportCardData } from "@/components/reports/ReportCardEditor";
import {
  loadReportContext,
  loadReportCard,
  saveReportCard,
  StudentOption,
  SubjectOption,
  TermOption,
} from "@/lib/reportCards";
import { SUBJECTS } from "@/lib/schoolConfig";

/**
 * Report cards live in the database (grades + term_results).
 * This workspace picks the pupil/term, loads what is stored and hands it to the
 * editor, which is only the layout and print surface.
 */
export const ReportCardWorkspace = () => {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState("");
  const [termId, setTermId] = useState("");
  const [initial, setInitial] = useState<Partial<ReportCardData> | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    loadReportContext().then((ctx) => {
      setStudents(ctx.students);
      setTerms(ctx.terms);
      setSubjects(ctx.subjects);
      setClasses(ctx.classes);
      const current = ctx.terms.find((t) => t.is_current) || ctx.terms[0];
      if (current) setTermId(current.id);
      setLoading(false);
    });
  }, []);

  const student = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);
  const term = useMemo(() => terms.find((t) => t.id === termId), [terms, termId]);

  useEffect(() => {
    if (!student || !termId) return;
    let cancelled = false;
    loadReportCard(student, termId, subjects, classes, SUBJECTS.slice(0, 12)).then((d) => {
      if (cancelled) return;
      setInitial({ ...d, term: term?.name || "", year: term?.session || String(new Date().getFullYear()) });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, termId, subjects.length, classes.length]);

  const persist = async (data: ReportCardData, publish: boolean) => {
    if (!student || !termId) {
      toast.error("Choose a pupil and a term first.");
      return;
    }
    setSaving(true);
    const { error } = await saveReportCard(data, student, termId, subjects, publish);
    setSaving(false);
    if (error) toast.error(error);
    else toast.success(publish ? "Report card saved and published." : "Report card saved to the database.");
  };


  return (
    <div className="space-y-4">
      <Card className="border-border/50 print:hidden">
        <CardContent className="p-4 grid gap-3 md:grid-cols-3 items-end">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground space-y-1">
            <span>Pupil</span>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case text-foreground"
            >
              <option value="">{loading ? "Loading pupils…" : "Select a pupil"}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} — {s.student_id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground space-y-1">
            <span>Term</span>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case text-foreground"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.session ? `(${t.session})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="text-xs text-muted-foreground">
            {student ? (
              <Badge variant="outline">Saved to grades &amp; term results</Badge>
            ) : (
              "Scores you enter are stored per subject and shared with the pupil and parent portals once published."
            )}
          </div>
        </CardContent>
      </Card>

      <ReportCardEditor
        key={`${studentId}-${termId}`}
        initial={initial}
        saving={saving}
        saveLabel={publish ? "Save & publish" : "Save to database"}
        onSave={(d) => persist(d, publish)}
        extraActions={
          <label className="flex items-center gap-2 text-sm text-muted-foreground px-2">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publish to pupil &amp; parent portals
          </label>
        }
      />
    </div>
  );
};

export default ReportCardWorkspace;
