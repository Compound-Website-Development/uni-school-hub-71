import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, AlertTriangle, Info, Bell } from "lucide-react";
import { format } from "date-fns";

const priorityConfig: Record<string, { icon: any; class: string; label: string }> = {
  urgent: { icon: AlertTriangle, class: "bg-destructive/10 text-destructive", label: "Urgent" },
  high: { icon: Bell, class: "bg-warning/10 text-warning", label: "High" },
  normal: { icon: Info, class: "bg-primary/10 text-primary", label: "Normal" },
};

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .in("target_role", ["all", "student"])
        .order("created_at", { ascending: false });

      setAnnouncements(data || []);
      setIsLoading(false);
    };
    fetchAnnouncements();
  }, []);

  return (
    <StudentLayout title="Announcements">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay up to date with school news</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl skeleton" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardContent className="p-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No announcements at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => {
              const config = priorityConfig[a.priority] || priorityConfig.normal;
              const Icon = config.icon;
              return (
                <Card key={a.id} className="rounded-xl border-border/50 shadow-card card-hover-subtle">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg shrink-0 ${config.class}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{a.title}</h3>
                          <Badge className={`${config.class} border-0 text-xs`}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{a.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {a.created_at ? format(new Date(a.created_at), "MMM d, yyyy 'at' h:mm a") : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentAnnouncements;
