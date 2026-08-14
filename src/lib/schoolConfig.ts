// Central school configuration for Imagemakers Nursery and Primary School.
// Approved by School Management — update here to change it everywhere.

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
  /** Allowed clock-in radius from the campus, in metres. */
  geofenceRadiusM: 400,
  /** Staff arriving after this time are marked late. */
  clockInCutoff: "07:45",
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

export interface GradeBand {
  min: number;
  max: number;
  remark: string;
}

export const GRADE_BANDS: GradeBand[] = [
  { min: 90, max: 100, remark: "Outstanding" },
  { min: 80, max: 89, remark: "Excellent" },
  { min: 70, max: 79, remark: "Very Good" },
  { min: 60, max: 69, remark: "Very Good" },
  { min: 50, max: 59, remark: "Good" },
  { min: 40, max: 49, remark: "Fair" },
  { min: 0, max: 39, remark: "Poor" },
];

export const PROMOTION_AVERAGE = 60;

/** Approved per-term fee structure (Naira). Mirrors the fee_items seeded in the database. */
export const FEE_STRUCTURE: { levels: string[]; tuition: number; pta: number; party: number; lesson: number }[] = [
  { levels: ["Kindergarten One"], tuition: 70000, pta: 5000, party: 10000, lesson: 15000 },
  { levels: ["Kindergarten Two"], tuition: 80000, pta: 5000, party: 10000, lesson: 15000 },
  { levels: ["Nursery One", "Nursery Two"], tuition: 95000, pta: 5000, party: 10000, lesson: 15000 },
  { levels: ["Grade One", "Grade Two", "Grade Three"], tuition: 115000, pta: 5000, party: 10000, lesson: 15000 },
  { levels: ["Grade Four", "Grade Five", "Grade Six"], tuition: 120000, pta: 5000, party: 10000, lesson: 15000 },
];


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
