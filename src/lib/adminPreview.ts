import { supabase } from "@/integrations/supabase/client";

/**
 * When an admin opens the parent portal without real child links, fall back to
 * the admin preview pupil chosen in useAuth so live data can be reviewed.
 */
export async function withAdminPreview<T extends { data: any[] | null }>(res: T): Promise<T> {
  if (res.data && res.data.length) return res;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res;
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (role?.role !== "admin") return res;
  const id = localStorage.getItem("im_preview_student_id") || (window as any).__imPreviewStudentId;
  if (!id) return res;
  return { ...res, data: [{ student_id: id }] };
}
