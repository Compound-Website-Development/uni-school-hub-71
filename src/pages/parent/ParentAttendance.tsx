import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Loader2 } from "lucide-react";

const ParentAttendance = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id);
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const [studentsRes, attendanceRes] = await Promise.all([
          supabase.from("students").select("*").in("id", ids),
          supabase.from("attendance").select("*").in("student_id", ids).order("date", { ascending: false }).limit(50),
        ]);
        setChildren(studentsRes.data || []);
        setAttendance(attendanceRes.data || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <ParentLayout title="Attendance"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Child's Attendance">
      <div className="space-y-6 animate-fade-in">
        {children.map((child) => {
          const childAtt = attendance.filter((a: any) => a.student_id === child.id);
          const present = childAtt.filter((a: any) => a.status === "present").length;
          const total = childAtt.length;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;
          return (
            <Card key={child.id} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {child.first_name} {child.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-success/10"><p className="text-2xl font-bold text-success">{present}</p><p className="text-xs text-muted-foreground">Present</p></div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10"><p className="text-2xl font-bold text-destructive">{total - present}</p><p className="text-xs text-muted-foreground">Absent</p></div>
                  <div className="text-center p-3 rounded-lg bg-primary/10"><p className="text-2xl font-bold text-primary">{rate}%</p><p className="text-xs text-muted-foreground">Rate</p></div>
                </div>
                <div className="space-y-1">
                  {childAtt.slice(0, 10).map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center p-2 rounded bg-muted/20 text-sm">
                      <span>{new Date(a.date).toLocaleDateString()}</span>
                      <Badge variant={a.status === "present" ? "default" : "destructive"} className="capitalize">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {children.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>}
      </div>
    </ParentLayout>
  );
};

export default ParentAttendance;
