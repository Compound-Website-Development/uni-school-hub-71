import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Calendar, CreditCard, Loader2 } from "lucide-react";

const ParentDashboard = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      if (links && links.length > 0) {
        const studentIds = links.map((l: any) => l.student_id);
        const { data: students } = await supabase
          .from("students")
          .select("*")
          .in("id", studentIds);
        setChildren(students || []);
      }
      setIsLoading(false);
    };
    fetchChildren();
  }, [user]);

  if (isLoading) {
    return (
      <ParentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Welcome, Parent 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">Monitor your child's academic progress.</p>
        </div>

        {children.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold text-foreground mb-2">No Children Linked</h3>
              <p className="text-sm text-muted-foreground">Contact the school administrator to link your child's account to your profile.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <Card key={child.id} className="border-border/50 card-hover-subtle">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    {child.first_name} {child.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student ID</span>
                      <span className="font-medium">{child.student_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">{child.status || "active"}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "View Grades", href: "/parent/grades", color: "text-primary bg-primary/10" },
            { icon: Calendar, label: "Attendance", href: "/parent/attendance", color: "text-info bg-info/10" },
            { icon: CreditCard, label: "Fee Status", href: "/parent/fees", color: "text-success bg-success/10" },
            { icon: GraduationCap, label: "Messages", href: "/parent/messages", color: "text-warning bg-warning/10" },
          ].map((item, idx) => (
            <a key={idx} href={item.href}>
              <Card className="border-border/50 card-hover-subtle">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-2`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </ParentLayout>
  );
};

export default ParentDashboard;
