import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Loader2 } from "lucide-react";

const eventTypeColors: Record<string, string> = {
  exam: "bg-destructive/10 text-destructive",
  holiday: "bg-success/10 text-success",
  meeting: "bg-info/10 text-info",
  sports: "bg-warning/10 text-warning",
  general: "bg-primary/10 text-primary",
};

const StudentCalendar = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from("school_events").select("*").order("event_date", { ascending: true });
      setEvents(data || []);
      setIsLoading(false);
    };
    fetchEvents();
  }, []);

  if (isLoading) {
    return <StudentLayout title="Calendar"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StudentLayout>;
  }

  const upcoming = events.filter((e) => new Date(e.event_date) >= new Date());
  const past = events.filter((e) => new Date(e.event_date) < new Date());

  return (
    <StudentLayout title="School Calendar">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><CalendarDays className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No upcoming events.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((e) => (
              <Card key={e.id} className="border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${eventTypeColors[e.event_type] || eventTypeColors.general}`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{e.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                    {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">{e.event_type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-muted-foreground">Past Events</h2>
            <div className="space-y-2 opacity-60">
              {past.slice(0, 5).map((e) => (
                <Card key={e.id} className="border-border/30">
                  <CardContent className="p-3 flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentCalendar;
