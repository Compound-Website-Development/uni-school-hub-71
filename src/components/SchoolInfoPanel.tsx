import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SCHOOL,
  TERMS,
  HOLIDAYS,
  GRADE_BANDS,
  PROMOTION_AVERAGE,
  ASSESSMENT_WEIGHTS,
  CLASS_STRUCTURE,
  SUBJECTS,
  STAFF_ASSIGNMENTS,
} from "@/lib/schoolConfig";
import { CalendarDays, GraduationCap, Info, Phone, Users } from "lucide-react";

interface Props {
  /** Which blocks to show. Defaults to the school + academic essentials. */
  sections?: Array<"school" | "terms" | "grading" | "classes" | "subjects" | "staff">;
}

export const SchoolInfoPanel = ({
  sections = ["school", "terms", "grading"],
}: Props) => {
  const show = (s: string) => sections.includes(s as never);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {show("school") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> School Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">{SCHOOL.name}</p>
            <p className="italic text-muted-foreground">“{SCHOOL.motto}”</p>
            <p className="text-muted-foreground">{SCHOOL.address}</p>
            <p className="text-muted-foreground">{SCHOOL.approvalNo}</p>
            <p className="text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> {SCHOOL.phones.join(" • ")}
            </p>
            <p className="text-muted-foreground">{SCHOOL.email}</p>
            <Badge variant="secondary">{SCHOOL.session}</Badge>
          </CardContent>
        </Card>
      )}

      {show("terms") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Academic Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {TERMS.map((t) => (
              <div key={t.order} className="flex justify-between gap-3">
                <span className="font-medium text-foreground">
                  {t.name} <span className="text-muted-foreground">({t.label})</span>
                </span>
                <span className="text-muted-foreground">{t.months}</span>
              </div>
            ))}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {HOLIDAYS.map((h) => (
                <Badge key={h} variant="outline" className="text-[11px]">
                  {h}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {show("grading") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" /> Grading & Promotion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {GRADE_BANDS.map((b) => (
                <div key={`${b.min}-${b.max}`} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {b.min === 0 ? "Below 40" : `${b.min}–${b.max}`}
                  </span>
                  <span className="font-medium text-foreground">{b.remark}</span>
                </div>
              ))}
            </div>
            <p className="pt-2 text-muted-foreground">
              Assessment: CA {ASSESSMENT_WEIGHTS.ca}% + Exam {ASSESSMENT_WEIGHTS.exam}% ={" "}
              {ASSESSMENT_WEIGHTS.total}%
            </p>
            <p className="text-muted-foreground">
              Promotion criteria: {PROMOTION_AVERAGE}% average
            </p>
          </CardContent>
        </Card>
      )}

      {show("classes") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Classes & Arms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {CLASS_STRUCTURE.map((c) => (
              <div key={c.level} className="flex justify-between gap-3">
                <span className="font-medium text-foreground">{c.level}</span>
                <span className="text-muted-foreground">{c.arms.join(", ")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {show("subjects") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subjects Offered</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {SUBJECTS.map((s) => (
              <Badge key={s} variant="outline" className="text-[11px]">
                {s}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {show("staff") && (
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Class Teachers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {STAFF_ASSIGNMENTS.map((s) => (
              <div key={s.level} className="flex justify-between gap-3">
                <span className="font-medium text-foreground">{s.level}</span>
                <span className="text-muted-foreground text-right">
                  {s.teachers.join(", ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchoolInfoPanel;
