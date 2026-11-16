import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, RuleList, EmptyState, StatusWord } from "@/components/student/editorial";
import { format } from "date-fns";

const priorityTone: Record<string, "muted" | "ink" | "alert" | "accent"> = {
  urgent: "alert",
  high: "accent",
  normal: "muted",
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
      <div className="mx-auto w-full max-w-3xl space-y-6 pb-4">
        <PageTitle eyebrow="School office" title="Announcements" lede="Notices published for pupils, newest first." />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notices…</p>
        ) : announcements.length === 0 ? (
          <EmptyState title="No announcements" hint="School notices will appear here." />
        ) : (
          <RuleList>
            {announcements.map((a) => (
              <li key={a.id} className="py-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="num editorial-eyebrow">
                    {a.created_at ? format(new Date(a.created_at), "d MMM yyyy · h:mm a") : ""}
                  </p>
                  <StatusWord label={a.priority || "normal"} tone={priorityTone[a.priority] || "muted"} />
                </div>
                <h2 className="font-display mt-1.5 text-xl font-bold leading-snug tracking-tight text-foreground">
                  {a.title}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {a.body || a.content}
                </p>
              </li>
            ))}
          </RuleList>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentAnnouncements;
