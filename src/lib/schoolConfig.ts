// Central school configuration for Imagemakers Nursery and Primary School.
// Confirmed school rules and reference information. Update here to change shared settings.

export const SCHOOL = {
  name: "Imagemakers Nursery and Primary School",
  shortName: "Imagemakers",
  motto: "Imparting Wisdom and Morals",
  approvalNo: "LASG APPROVAL NO: SLR/14097",
  address:
    "38E Nathan Street, Off Ojuelegba Road, By Surulere Baptist Church, Surulere, Lagos",
  email: "imagemakersschool123@gmail.com",
  phones: ["08138062345", "08054389290"],
  session: "2026/2027 Academic Session",
  /** Campus coordinates (38E Nathan Street, Surulere, Lagos) used for geofenced staff clock-in. */
  coords: { lat: 6.5095, lng: 3.3596 },
  /**
   * Existing configured radius. Management has confirmed the 07:30 clock-in
   * time but has not yet confirmed the geofence radius. Do not describe 400 m
   * as a school-approved policy until the school confirms it.
   */
  geofenceRadiusM: 400,
  /** School management confirmed 07:30 as the staff clock-in time on 9 Nov 2026. */
  clockInCutoff: "07:30",
};

export interface TermInfo {
  order: number;
  name: string;
  label: string;
  months: string;
}

export const TERMS: TermInfo[] = [
  { order: 1, name: "Wisdom Term", label: "1st Term", months: "September – December" },
  { order: 2, name: "Excellent Term", label: "2nd Term", months: "January – April" },
  { order: 3, name: "Glorious Term", label: "3rd Term", months: "April – July" },
];

export const HOLIDAYS = [
  "Christmas Holiday",
  "Easter Holiday",
  "Muslim Holidays",
  "Democracy Day",
  "Independence Day",
];

export const SUBJECTS = [
  "Mathematics",
  "English Language",
  "Quantitative Aptitude",
  "Verbal Aptitude",
  "IRK",
  "CRK",
  "Basic Science",
  "Coding",
  "ICT",
  "Creative Art",
  "Vocational Aptitude",
  "French",
  "Diction",
  "Music",
  "Abacus",
  "Yoruba",
  "Phonics",
  "Handwriting",
  "History",
  "Physical & Health Education",
  "National Value",
];

/** Specialist subjects the school identified as using a separate A–E letter scale. */
export const SPECIALIST_LETTER_GRADE_SUBJECTS = [
  "French",
  "Diction",
  "Coding",
  "Abacus",
  "Creative Art",
  "Yoruba",
];

/**
 * The A–E letters are confirmed for the specialist subjects above. The school
 * has not supplied score boundaries or confirmed how these letters are entered
 * alongside the standard CA/Exam result. Do not infer numeric thresholds.
 */
export const SPECIALIST_LETTER_GRADES = ["A", "B", "C", "D", "E"] as const;

export interface GradeBand {
  min: number;
  max: number;
  remark: string;
}

export const GRADE_BANDS: GradeBand[] = [
  // Official descriptive bands confirmed by Mr Joseph on 26 October 2026.
  { min: 90, max: 100, remark: "Outstanding" },
  { min: 70, max: 89, remark: "Excellent" },
  { min: 60, max: 69, remark: "Very Good" },
  { min: 50, max: 59, remark: "Good" },
  { min: 40, max: 49, remark: "Fair" },
  { min: 0, max: 39, remark: "Poor" },
];

/**
 * Existing general numeric-to-letter conversion. This A–F mapping has not
 * been approved as the school's official grading scale. Specialist subjects
 * use A–E, but their score boundaries and entry workflow remain to be confirmed.
 */
export function letterGradeForScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

/** School-approved minimum average for promotion, confirmed 9 November 2026. */
export const PROMOTION_AVERAGE = 50;

/** School tuition amounts were not confirmed by management. Use the editable fee_items catalogue in Supabase; do not hardcode assumed tuition values here. */
export const FEE_STRUCTURE: { levels: string[]; tuition: number; pta: number; party: number; lesson: number }[] = [];


/** Continuous Assessment / Examination weighting used on the report card. */
export const ASSESSMENT_WEIGHTS = { ca: 40, exam: 60, total: 100 };

export function remarkForScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "";
  const band = GRADE_BANDS.find((b) => score >= b.min && score <= b.max);
  return band?.remark ?? "";
}

export interface ClassLevel {
  level: string;
  arms: string[];
}

export const CLASS_STRUCTURE: ClassLevel[] = [
  { level: "Kindergarten One", arms: ["Faith"] },
  { level: "Kindergarten Two", arms: ["Joy", "Hope"] },
  { level: "Nursery One", arms: ["Pearl"] },
  { level: "Nursery Two", arms: ["Gift", "Love"] },
  { level: "Grade One", arms: ["Emerald", "Peace"] },
  { level: "Grade Two", arms: ["Topaz"] },
  { level: "Grade Three", arms: ["Ruby"] },
  { level: "Grade Four", arms: ["Sapphire"] },
  { level: "Grade Five", arms: ["Zircon"] },
  { level: "Grade Six", arms: ["Diamond"] },
];

export const CLASS_OPTIONS = CLASS_STRUCTURE.flatMap((c) =>
  c.arms.map((arm) => `${c.level} (${arm})`)
);

export const STAFF_ASSIGNMENTS: { level: string; teachers: string[] }[] = [
  { level: "Kindergarten One", teachers: ["Miss Labake Luyi"] },
  { level: "Kindergarten Two", teachers: ["Mrs Ifunaya Ohagbulem", "Mrs Janet Tuwa"] },
  { level: "Nursery One", teachers: ["Miss Unyime-Abasi Ukeme", "Miss Ada Obumnene"] },
  { level: "Nursery Two", teachers: ["Mrs Egwu Nkechinyere", "Mrs Morounntonu Temitope"] },
  { level: "Grade One", teachers: ["Mrs George Udo-Affia", "Miss Kemi Adetutu"] },
  { level: "Grade Two", teachers: ["Mrs Aniekwe Jessica"] },
  { level: "Grade Three", teachers: ["Mr Promise Emmanuel", "Miss Esther Oni"] },
  { level: "Grade Four", teachers: ["Mrs Mpamah Anthonia", "Mrs Salako Gift"] },
  { level: "Grade Five", teachers: ["Miss Taiwo Abraham"] },
  { level: "Grade Six", teachers: ["Mr Osita Emenike"] },
];

export const AFFECTIVE_TRAITS = [
  "Punctuality",
  "Neatness",
  "Helping others",
  "Attitude to work",
  "Leadership",
  "Attentiveness",
];

export const PSYCHOMOTOR_SKILLS = ["Verbal Fluency", "Games", "Sports", "Drawing"];

export const RATING_KEY: { value: number; label: string }[] = [
  { value: 5, label: "Excellent" },
  { value: 4, label: "Good" },
  { value: 3, label: "Average" },
  { value: 2, label: "Fair" },
  { value: 1, label: "Poor" },
];
