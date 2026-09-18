import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AssignedClass {
  id: string;
  name: string;
}

export const useAssignedClass = () => {
  const { teacherData, isLoading: isAuthLoading } = useAuth();
  const [assignedClass, setAssignedClass] = useState<AssignedClass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssignedClass = async () => {
      if (isAuthLoading) return;
      if (!teacherData?.id) {
        setAssignedClass(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("class_teacher_id", teacherData.id)
        .order("name")
        .limit(1)
        .maybeSingle();

      setAssignedClass(data || null);
      setIsLoading(false);
    };

    loadAssignedClass();
  }, [isAuthLoading, teacherData?.id]);

  return { assignedClass, isLoading };
};