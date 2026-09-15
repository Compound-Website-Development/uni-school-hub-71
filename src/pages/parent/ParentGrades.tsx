import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CanonicalReportCard from "@/components/reports/CanonicalReportCard";
import { Loader2 } from "lucide-react";

/**
 * Parents read the same published report card the school issued — the canonical
 * sheet, read-only, with one tab per linked child.
 */
const ParentGrades = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const { data: students } = await supabase
          .from("students")
          .select("id, first_name, last_name, student_id")
          .in("id", ids)
          .order("first_name");
        setChildren(students || []);
        setActiveId((students || [])[0]?.id ?? "");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <ParentLayout title="Child's Results">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Child's Results">
      <div className="space-y-5 animate-fade-in">
        {children.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>
        ) : (
          <>
            {children.length > 1 && (
              <div className="flex flex-wrap gap-2 print:hidden">
                {children.map((c) => (
                  <Button
                    key={c.id}
                    size="sm"
                    variant={activeId === c.id ? "default" : "outline"}
                    onClick={() => setActiveId(c.id)}
                    className="rounded-full"
                  >
                    {c.first_name} {c.last_name}
                  </Button>
                ))}
              </div>
            )}
            <CanonicalReportCard studentId={activeId} requirePublished />
          </>
        )}
      </div>
    </ParentLayout>
  );
};

export default ParentGrades;
