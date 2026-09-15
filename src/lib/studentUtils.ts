import { supabase } from "@/integrations/supabase/client";
import { CLASS_STRUCTURE } from "@/lib/schoolConfig";

/** Rough Nigerian nursery/primary age ladder used for TEMPORARY class placement. */
const AGE_LADDER: { maxAge: number; level: string }[] = [
  { maxAge: 4, level: "Kindergarten One" },
  { maxAge: 5, level: "Kindergarten Two" },
  { maxAge: 6, level: "Nursery One" },
  { maxAge: 7, level: "Nursery Two" },
  { maxAge: 8, level: "Grade One" },
  { maxAge: 9, level: "Grade Two" },
  { maxAge: 10, level: "Grade Three" },
  { maxAge: 11, level: "Grade Four" },
  { maxAge: 12, level: "Grade Five" },
  { maxAge: 99, level: "Grade Six" },
];

export const ageFromDob = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

/** Suggest a class LEVEL name from the date of birth. Always editable by the admin. */
export const suggestLevelForDob = (dob?: string | null): string | null => {
  const age = ageFromDob(dob);
  if (age === null || age < 0) return null;
  return AGE_LADDER.find((r) => age <= r.maxAge)?.level ?? null;
};

/** Match a suggested level to one of the school's real class arms. */
export const suggestClassId = (
  dob: string | null | undefined,
  classes: { id: string; name: string; level?: string | null }[],
): string | null => {
  const level = suggestLevelForDob(dob);
  if (!level) return null;
  const match = classes.find(
    (c) => (c.level || "").toLowerCase() === level.toLowerCase() || c.name.toLowerCase().startsWith(level.toLowerCase()),
  );
  return match?.id ?? null;
};

export const LEVEL_NAMES = CLASS_STRUCTURE.map((c) => c.level);

const randomBlock = (len: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const generateParentId = () => `IMS-P-${randomBlock(6)}`;
export const generateParentCode = () => randomBlock(6);

/**
 * Upload a passport photo and return its STORAGE PATH.
 * The path is what we persist; display URLs are signed on demand and refreshed
 * (see `resolveStudentPhoto`) instead of baking in a one-year link.
 */
export const uploadStudentPhoto = async (studentKey: string, file: File): Promise<string | null> => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${studentKey}/passport.${ext}`;
  const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true });
  if (error) return null;
  return path;
};

