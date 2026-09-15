import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AdminPermission =
  | "can_add_admins"
  | "can_manage_students"
  | "can_upload_bulk_data"
  | "can_approve_grades"
  | "can_manage_teachers"
  | "can_manage_fees"
  | "can_view_reports";

/**
 * Admin permission sets. "Bursar" is an admin whose only enabled permission is
 * can_manage_fees. Admins with no permission row keep full access.
 */
export const useAdminPermissions = () => {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || userRole !== "admin") {
      setPermissions(null);
      setIsLoading(false);
      return;
    }
    supabase
      .from("admin_permissions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPermissions((data as any) ?? null);
        setIsLoading(false);
      });
  }, [user?.id, userRole]);

  const can = (permission: AdminPermission) => {
    if (userRole !== "admin") return false;
    if (!permissions) return true; // admin without an explicit row = full access
    return Boolean(permissions[permission]);
  };

  return { can, permissions, isLoading, isAdmin: userRole === "admin" };
};
