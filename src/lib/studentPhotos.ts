import { supabase } from "@/integrations/supabase/client";

const BUCKET = "student-photos";

/** True when the stored value is already a full URL (legacy rows). */
const isUrl = (v: string) => /^https?:\/\//i.test(v);

const cache = new Map<string, { url: string; expires: number }>();

/**
 * Resolve a stored student photo reference to a usable image URL.
 * New records store the storage PATH; we mint a short-lived signed URL on demand
 * (and cache it) instead of relying on a one-year link that silently rots.
 */
export const resolveStudentPhoto = async (ref?: string | null): Promise<string | null> => {
  if (!ref) return null;
  if (isUrl(ref)) return ref;

  const hit = cache.get(ref);
  if (hit && hit.expires > Date.now()) return hit.url;

  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(ref, 60 * 60);
  if (!data?.signedUrl) return null;
  cache.set(ref, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
};

/** Resolve many references at once (ID card batches, student tables). */
export const resolveStudentPhotos = async (refs: (string | null | undefined)[]) => {
  const map = new Map<string, string>();
  await Promise.all(
    Array.from(new Set(refs.filter(Boolean) as string[])).map(async (ref) => {
      const url = await resolveStudentPhoto(ref);
      if (url) map.set(ref, url);
    }),
  );
  return map;
};
