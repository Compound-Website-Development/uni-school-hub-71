import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2 } from "lucide-react";

const ParentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id);
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const [studentsRes, gradesRes] = await Promise.all([
          supabase.from("students").select("*").in("id", ids),
          supabase.from("grades").select("*, subjects(name), terms(name)").in("student_id", ids),
        ]);
        setChildren(studentsRes.data || []);
        setGrades(gradesRes.data || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <ParentLayout title="Child's Grades"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Child's Grades">
      <div className="space-y-6 animate-fade-in">
        {children.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>
        ) : children.map((child) => {
          const childGrades = grades.filter((g: any) => g.student_id === child.id);
          return (
            <Card key={child.id} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {child.first_name} {child.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {childGrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No grades available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {childGrades.map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{g.subjects?.name || "Subject"}</p>
                          <p className="text-xs text-muted-foreground">{g.terms?.name || "Term"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{g.total_score}%</span>
                          <Badge variant="outline">{g.letter_grade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ParentLayout>
  );
};

export default ParentGrades;
