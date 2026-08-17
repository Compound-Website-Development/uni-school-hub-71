import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo";
import {
  SCHOOL,
  TERMS,
  SUBJECTS,
  AFFECTIVE_TRAITS,
  PSYCHOMOTOR_SKILLS,
  RATING_KEY,
  ASSESSMENT_WEIGHTS,
  CLASS_OPTIONS,
  PROMOTION_AVERAGE,
  remarkForScore,
} from "@/lib/schoolConfig";
import { Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";

export interface SubjectRow {
  subject: string;
  ca: number | null;
  exam: number | null;
}

export interface ReportCardData {
  pupilName: string;
  pupilId: string;
  gender: string;
  age: string;
  className: string;
  year: string;
  term: string;
  nextTermBegins: string;
  timesOpened: string;
  timesPresent: string;
  subjects: SubjectRow[];
  affective: Record<string, number>;
  psychomotor: Record<string, number>;
  position: string;
  classTeacherComment: string;
  headTeacherComment: string;
  classTeacherName: string;
  headTeacherName: string;
}

export const emptyReportCard = (): ReportCardData => ({
  pupilName: "",
  pupilId: "",
  gender: "",
  age: "",
  className: CLASS_OPTIONS[0] ?? "",
  year: String(new Date().getFullYear()),
  term: TERMS[0].label,
  nextTermBegins: "",
  timesOpened: "",
  timesPresent: "",
  subjects: SUBJECTS.slice(0, 12).map((s) => ({ subject: s, ca: null, exam: null })),
  affective: Object.fromEntries(AFFECTIVE_TRAITS.map((t) => [t, 0])),
  psychomotor: Object.fromEntries(PSYCHOMOTOR_SKILLS.map((t) => [t, 0])),
  position: "",
  classTeacherComment: "",
  headTeacherComment: "",
  classTeacherName: "",
  headTeacherName: "",
});



const Field = ({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
  readOnly?: boolean;
}) => (
  <label className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${className}`}>
    <span className="shrink-0">{label}</span>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className={`h-8 text-sm font-normal normal-case tracking-normal text-foreground ${readOnly ? "border-transparent bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0" : ""}`}
    />
  </label>
);

const RatingBoxes = ({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
}) => (
  <div className="flex gap-1">
    {RATING_KEY.map((r) => (
      <button
        key={r.value}
        type="button"
        aria-label={`${r.value} – ${r.label}`}
        disabled={readOnly}
        onClick={() => (readOnly ? undefined : onChange(value === r.value ? 0 : r.value))}
        className={`w-6 h-6 border border-border rounded-sm text-[11px] leading-none flex items-center justify-center transition-colors ${
          value === r.value
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-muted"
        }`}
      >
        {value === r.value ? "✓" : ""}
      </button>
    ))}
  </div>
);

interface Props {
  initial?: Partial<ReportCardData>;
  /** Persistence handler. The editor itself is only the layout/print surface. */
  onSave?: (data: ReportCardData) => void | Promise<void>;
  saveLabel?: string;
  saving?: boolean;
  extraActions?: React.ReactNode;
  /** Renders the official sheet as a read-only document (pupil/parent view). */
  readOnly?: boolean;
}

export const ReportCardEditor = ({ initial, onSave, saveLabel = "Save", saving = false, extraActions, readOnly = false }: Props) => {
  const { toast } = useToast();
  const [data, setData] = useState<ReportCardData>(() => ({ ...emptyReportCard(), ...initial }));

  useEffect(() => {
    if (initial) setData((d) => ({ ...d, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial ?? {})]);

  const set = <K extends keyof ReportCardData>(key: K, value: ReportCardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const updateSubject = (i: number, patch: Partial<SubjectRow>) =>
    setData((d) => ({
      ...d,
      subjects: d.subjects.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const totals = useMemo(() => {
    const rows = data.subjects.filter((s) => s.subject.trim() !== "");
    const scored = rows.filter((s) => s.ca !== null || s.exam !== null);
    const totalScore = scored.reduce((sum, s) => sum + (s.ca ?? 0) + (s.exam ?? 0), 0);
    const overall = scored.length * ASSESSMENT_WEIGHTS.total;
    const percentage = overall > 0 ? (totalScore / overall) * 100 : 0;
    return { totalScore, overall, percentage, count: scored.length };
  }, [data.subjects]);

  const handleSave = async () => {
    if (!onSave) {
      toast({ title: "Nothing to save", description: "Select a pupil and term first." });
      return;
    }
    await onSave(data);
  };

  const handleReset = () => setData({ ...emptyReportCard(), ...initial });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        {!readOnly && (
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : saveLabel}
          </Button>
        )}
        {extraActions}

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print / PDF
        </Button>
        {!readOnly && (
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Clear
          </Button>
        )}
      </div>

      <Card className="rounded-xl border-border/50 shadow-card print:shadow-none print:border-0">
        <CardContent className="p-4 md:p-6 space-y-4" id="report-card-sheet">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-border pb-3">
            <img src={logoImg} alt={`${SCHOOL.name} logo`} className="w-16 h-16 object-contain" />
            <div className="flex-1 text-center">
              <h2 className="text-lg md:text-xl font-bold text-primary uppercase leading-tight">
                {SCHOOL.name}
              </h2>
              <p className="text-xs text-muted-foreground">{SCHOOL.address}</p>
              <p className="text-xs text-muted-foreground">
                {SCHOOL.phones.join(", ")} • {SCHOOL.email}
              </p>
              <p className="text-[11px] italic text-muted-foreground">
                “{SCHOOL.motto}” • {SCHOOL.approvalNo}
              </p>
            </div>
          </div>

          {/* Pupil details */}
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Pupil's Name" value={data.pupilName} onChange={(v) => set("pupilName", v)} className="md:col-span-2" readOnly={readOnly} />
            <Field label="ID" value={data.pupilId} onChange={(v) => set("pupilId", v)} readOnly={readOnly} />
            <Field label="Gender" value={data.gender} onChange={(v) => set("gender", v)} readOnly={readOnly} />
            <Field label="Age" value={data.age} onChange={(v) => set("age", v)} readOnly={readOnly} />
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="shrink-0">Class</span>
              <select
                value={data.className}
                disabled={readOnly}
                onChange={(e) => set("className", e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <Field label="Year" value={data.year} onChange={(v) => set("year", v)} readOnly={readOnly} />
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="shrink-0">Term</span>
              <select
                value={data.term}
                disabled={readOnly}
                onChange={(e) => set("term", e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {TERMS.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label} – {t.name}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Next Term Begins" value={data.nextTermBegins} onChange={(v) => set("nextTermBegins", v)} readOnly={readOnly} />
            <Field label="Times Opened" value={data.timesOpened} onChange={(v) => set("timesOpened", v)} readOnly={readOnly} />
            <Field label="Times Present" value={data.timesPresent} onChange={(v) => set("timesPresent", v)} readOnly={readOnly} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Subjects */}
            <div className="lg:col-span-2 space-y-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-xs uppercase">
                    <th className="border border-border p-1.5 text-left">Subjects</th>
                    <th className="border border-border p-1.5 w-16">C.A<br /><span className="font-normal">{ASSESSMENT_WEIGHTS.ca}</span></th>
                    <th className="border border-border p-1.5 w-16">Exam<br /><span className="font-normal">{ASSESSMENT_WEIGHTS.exam}</span></th>
                    <th className="border border-border p-1.5 w-16">Total<br /><span className="font-normal">{ASSESSMENT_WEIGHTS.total}</span></th>
                    <th className="border border-border p-1.5 text-left">Remark</th>
                    {!readOnly && <th className="border border-border p-1.5 w-8 print:hidden"></th>}
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.map((row, i) => {
                    const total = (row.ca ?? 0) + (row.exam ?? 0);
                    const hasScore = row.ca !== null || row.exam !== null;
                    return (
                      <tr key={i}>
                        <td className="border border-border p-0">
                          <input
                            value={row.subject}
                            readOnly={readOnly}
                            onChange={(e) => updateSubject(i, { subject: e.target.value })}
                            list="subject-options"
                            className="w-full h-8 px-2 bg-transparent outline-none focus:bg-muted/40"
                          />
                        </td>
                        <td className="border border-border p-0">
                          <input
                            type="number"
                            min={0}
                            max={ASSESSMENT_WEIGHTS.ca}
                            readOnly={readOnly}
                            value={row.ca ?? ""}
                            onChange={(e) => updateSubject(i, { ca: e.target.value === "" ? null : Number(e.target.value) })}
                            className="w-full h-8 px-2 text-center bg-transparent outline-none focus:bg-muted/40"
                          />
                        </td>
                        <td className="border border-border p-0">
                          <input
                            type="number"
                            min={0}
                            max={ASSESSMENT_WEIGHTS.exam}
                            readOnly={readOnly}
                            value={row.exam ?? ""}
                            onChange={(e) => updateSubject(i, { exam: e.target.value === "" ? null : Number(e.target.value) })}
                            className="w-full h-8 px-2 text-center bg-transparent outline-none focus:bg-muted/40"
                          />
                        </td>
                        <td className="border border-border p-1.5 text-center font-semibold">
                          {hasScore ? total : ""}
                        </td>
                        <td className="border border-border p-1.5 text-muted-foreground">
                          {hasScore ? remarkForScore(total) : ""}
                        </td>
                        {!readOnly && (
                        <td className="border border-border p-0 text-center print:hidden">
                          <button
                            type="button"
                            aria-label="Remove subject"
                            onClick={() =>
                              setData((d) => ({ ...d, subjects: d.subjects.filter((_, idx) => idx !== i) }))
                            }
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="subject-options">
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <Button
                variant="outline"
                size="sm"
                className={readOnly ? "hidden" : "print:hidden"}
                onClick={() =>
                  setData((d) => ({ ...d, subjects: [...d.subjects, { subject: "", ca: null, exam: null }] }))
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Subject
              </Button>
            </div>

            {/* Affective / psychomotor */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase text-primary mb-1">Affective Domain</p>
                <div className="space-y-1">
                  {AFFECTIVE_TRAITS.map((t) => (
                    <div key={t} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{t}</span>
                      <RatingBoxes
                        readOnly={readOnly}
                        value={data.affective[t] ?? 0}
                        onChange={(v) => set("affective", { ...data.affective, [t]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-primary mb-1">Psychomotor Skills</p>
                <div className="space-y-1">
                  {PSYCHOMOTOR_SKILLS.map((t) => (
                    <div key={t} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{t}</span>
                      <RatingBoxes
                        readOnly={readOnly}
                        value={data.psychomotor[t] ?? 0}
                        onChange={(v) => set("psychomotor", { ...data.psychomotor, [t]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-primary mb-1">Key</p>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-3">
                  {RATING_KEY.map((r) => (
                    <span key={r.value}>{r.value} – {r.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-y border-border py-3 text-center">
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Overall</p>
              <p className="font-bold text-foreground">{totals.overall || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Total Score</p>
              <p className="font-bold text-foreground">{totals.totalScore || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-muted-foreground">Percentage</p>
              <p className={`font-bold ${totals.percentage >= PROMOTION_AVERAGE ? "text-success" : "text-destructive"}`}>
                {totals.count ? `${totals.percentage.toFixed(2)}%` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">{remarkForScore(totals.count ? totals.percentage : undefined)}</p>
            </div>
            <div className="text-left md:text-center">
              <p className="text-[11px] uppercase text-muted-foreground">Position</p>
              <Input
                value={data.position}
                readOnly={readOnly}
                onChange={(e) => set("position", e.target.value)}
                className={`h-8 text-center ${readOnly ? "border-transparent bg-transparent font-bold shadow-none focus-visible:ring-0" : ""}`}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">Class Teacher's Comment</p>
              <Textarea
                rows={2}
                readOnly={readOnly}
                value={data.classTeacherComment}
                onChange={(e) => set("classTeacherComment", e.target.value)}
              />
            </div>
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">Head Teacher's Comment</p>
              <Textarea
                rows={2}
                readOnly={readOnly}
                value={data.headTeacherComment}
                onChange={(e) => set("headTeacherComment", e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3 pt-2">
              <Field label="Class Teacher" value={data.classTeacherName} onChange={(v) => set("classTeacherName", v)} readOnly={readOnly} />
              <Field label="Head Teacher" value={data.headTeacherName} onChange={(v) => set("headTeacherName", v)} readOnly={readOnly} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportCardEditor;
