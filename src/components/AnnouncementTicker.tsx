import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Megaphone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; detail: string; kind: "event" | "notice"; urgent: boolean };

const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const whenText = (d: string) => { const n = daysUntil(d); return n <= 0 ? "Today" : n === 1 ? "Tomorrow" : n < 7 ? `In ${n} days` : n < 31 ? `In ${Math.round(n / 7)} week${n >= 11 ? "s" : ""}` : new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" }); };

export const AnnouncementTicker = ({ audience }: { audience: "parent" | "student" }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const roles = ["all", audience, audience + "s"];
    Promise.all([
      supabase.from("school_events").select("id,title,event_date,location,priority,target_role,is_published").gte("event_date", today).eq("is_published", true).order("event_date").limit(8),
      supabase.from("announcements").select("id,title,body,priority,target_role,starts_at,ends_at").eq("is_published", true).order("created_at", { ascending: false }).limit(8),
    ]).then(([ev, an]) => {
      const events: Item[] = (ev.data || []).filter((e: any) => roles.includes(e.target_role || "all")).map((e: any) => ({ id: "e" + e.id, kind: "event", urgent: e.priority === "high" || e.priority === "urgent", title: e.title, detail: `${whenText(e.event_date)}${e.location ? " · " + e.location : ""}` }));
      const notices: Item[] = (an.data || []).filter((a: any) => roles.includes(a.target_role || "all") && (!a.starts_at || a.starts_at <= now) && (!a.ends_at || a.ends_at >= now)).map((a: any) => ({ id: "a" + a.id, kind: "notice", urgent: a.priority === "high" || a.priority === "urgent", title: a.title, detail: (a.body || "").slice(0, 90) }));
      setItems([...events, ...notices]);
    });
  }, [audience]);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const it = items[i % items.length];
  const Icon = it.kind === "event" ? CalendarDays : Megaphone;
  return (
    <section aria-live="polite" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div key={it.id} className="flex items-center gap-3 px-4 py-3 animate-fade-in">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", it.urgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-muted-foreground">{it.kind === "event" ? "Coming up" : "School notice"}</p>
          <p className="truncate text-sm font-bold text-foreground">{it.title}</p>
          {it.detail && <p className="truncate text-xs text-muted-foreground">{it.detail}</p>}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      {items.length > 1 && <div className="flex justify-center gap-1 pb-2">{items.map((x, n) => <button key={x.id} aria-label={`Show item ${n + 1}`} onClick={() => setI(n)} className={cn("h-1.5 rounded-full transition-all", n === i % items.length ? "w-5 bg-primary" : "w-1.5 bg-border")} />)}</div>}
    </section>
  );
};
