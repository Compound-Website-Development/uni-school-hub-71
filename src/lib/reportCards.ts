import { supabase } from "@/integrations/supabase/client";
import type { ReportCardData, SubjectRow } from "@/components/reports/ReportCardEditor";
import { AFFECTIVE_TRAITS, PSYCHOMOTOR_SKILLS, ASSESSMENT_WEIGHTS } from "@/lib/schoolConfig";

export interface StudentOption {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  class_id: string | null;
}

export interface TermOption {
  id: string;
  name: string;
  session: string | null;
  is_current: boolean;
}

export interface SubjectOption {
  id: string;
  name: string;
}

/** Everything the report card workspace needs to map names <-> ids. */
export const loadReportContext = async () => {
  const [{ data: students }, { data: terms }, { data: subjects }, { data: classes }] = await Promise.all([
    supabase
      .from("students")
      .select("id, student_id, first_name, last_name, middle_name, gender, date_of_birth, class_id")
      .order("last_name"),
    supabase.from("terms").select("id, name, session, is_current").order("created_at"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("classes").select("id, name").order("name"),
  ]);
  return {
    students: (students || []) as StudentOption[],
    terms: (terms || []) as TermOption[],
    subjects: (subjects || []) as SubjectOption[],
    classes: (classes || []) as { id: string; name: string }[],
  };
};

const ageFrom = (dob?: string | null) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
};

/** Read a pupil's stored report card for a term (grades + term_results + attendance). */
export const loadReportCard = async (
  student: StudentOption,
  termId: string,
  subjects: SubjectOption[],
  classes: { id: string; name: string }[],
  fallbackSubjects: string[],
): Promise<Partial<ReportCardData>> => {
  const [{ data: grades }, { data: result }, { count: presentCount }, { count: totalCount }] = await Promise.all([
    supabase
      .from("grades")
      .select("subject_id, continuous_assessment, exam_score")
      .eq("student_id", student.id)
      .eq("term_id", termId),
    supabase
      .from("term_results")
      .select("*")
      .eq("student_id", student.id)
      .eq("term_id", termId)
      .maybeSingle(),
    supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "present"),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("student_id", student.id),
  ]);

  const byId = new Map(subjects.map((s) => [s.id, s.name]));
  const scored: SubjectRow[] = (grades || []).map((g: any) => ({
    subject: byId.get(g.subject_id) || "",
    ca: g.continuous_assessment === null ? null : Number(g.continuous_assessment),
    exam: g.exam_score === null ? null : Number(g.exam_score),
  }));
  const scoredNames = new Set(scored.map((s) => s.subject));
  const rows = [
    ...scored.filter((s) => s.subject),
    ...fallbackSubjects.filter((n) => !scoredNames.has(n)).map((n) => ({ subject: n, ca: null, exam: null })),
  ];

  const r: any = result;
  return {
    pupilName: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
    pupilId: student.student_id,
    gender: student.gender || "",
    age: ageFrom(student.date_of_birth),
    className: classes.find((c) => c.id === student.class_id)?.name || "",
    subjects: rows,
    affective: r?.affective && Object.keys(r.affective).length
      ? r.affective
      : Object.fromEntries(AFFECTIVE_TRAITS.map((t) => [t, 0])),
    psychomotor: r?.psychomotor && Object.keys(r.psychomotor).length
      ? r.psychomotor
      : Object.fromEntries(PSYCHOMOTOR_SKILLS.map((t) => [t, 0])),
    position: r?.class_position ? String(r.class_position) : "",
    classTeacherComment: r?.teacher_comment || "",
    headTeacherComment: r?.principal_comment || "",
    timesOpened: r?.times_opened != null ? String(r.times_opened) : String(totalCount ?? ""),
    timesPresent: r?.times_present != null ? String(r.times_present) : String(presentCount ?? ""),
    nextTermBegins: r?.next_term_begins || "",
  };
};

/** Persist a report card: one grades row per scored subject plus the term_results summary. */
export const saveReportCard = async (
  data: ReportCardData,
  student: StudentOption,
  termId: string,
  subjects: SubjectOption[],
  publish: boolean,
): Promise<{ error: string | null }> => {
  const byName = new Map(subjects.map((s) => [s.name.toLowerCase(), s.id]));
  const scored = data.subjects.filter((s) => s.subject.trim() && (s.ca !== null || s.exam !== null));

  const missing = scored.filter((s) => !byName.has(s.subject.trim().toLowerCase()));
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("subjects")
      .insert(missing.map((s) => ({ name: s.subject.trim() })))
      .select("id, name");
    if (error) return { error: `Could not create subject(s): ${error.message}` };
    (created || []).forEach((s: any) => byName.set(s.name.toLowerCase(), s.id));
  }

  if (scored.length) {
    const { error } = await supabase.from("grades").upsert(
      scored.map((s) => ({
        student_id: student.id,
        subject_id: byName.get(s.subject.trim().toLowerCase())!,
        term_id: termId,
        class_id: student.class_id,
        continuous_assessment: s.ca ?? 0,
        exam_score: s.exam ?? 0,
        status: publish ? "approved" : "draft",
      })),
      { onConflict: "student_id,subject_id,term_id" },
    );
    if (error) return { error: error.message };
  }

  const overall = scored.length * ASSESSMENT_WEIGHTS.total;
  const totalScore = scored.reduce((sum, s) => sum + (s.ca ?? 0) + (s.exam ?? 0), 0);
  const average = overall > 0 ? (totalScore / overall) * 100 : null;

  const { error: trError } = await supabase.from("term_results").upsert(
    {
      student_id: student.id,
      term_id: termId,
      average,
      class_position: data.position ? Number(data.position.replace(/\D/g, "")) || null : null,
      teacher_comment: data.classTeacherComment || null,
      principal_comment: data.headTeacherComment || null,
      affective: data.affective,
      psychomotor: data.psychomotor,
      times_opened: data.timesOpened ? Number(data.timesOpened) : null,
      times_present: data.timesPresent ? Number(data.timesPresent) : null,
      next_term_begins: data.nextTermBegins || null,
      is_published: publish,
    },
    { onConflict: "student_id,term_id" },
  );
  if (trError) return { error: trError.message };
  return { error: null };
};
