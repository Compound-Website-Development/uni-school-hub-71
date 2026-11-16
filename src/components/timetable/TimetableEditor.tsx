import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
type Row = { id?: string; day_of_week: number; start_time: string; end_time: string; subject_id: string; room: string };

/** Period-by-period editor for one class. Viewers use TimetableViewer. */
export const TimetableEditor = ({ classId }: { classId: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [day, setDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: subs }] = await Promise.all([
      supabase.from("schedules").select("id,day_of_week,start_time,end_time,subject_id,room").eq("class_id", classId).order("start_time"),
      supabase.from("subjects").select("id,name").order("name"),
    ]);
    setRows((s || []).map((r: any) => ({ ...r, start_time: (r.start_time || "").slice(0, 5), end_time: (r.end_time || "").slice(0, 5), subject_id: r.subject_id || "", room: r.room || "" })));
    setSubjects(subs || []);
    setLoading(false);
  };
  useEffect(() => { if (classId) void load(); }, [classId]);

  const dayRows = useMemo(() => rows.map((r, idx) => ({ r, idx })).filter(({ r }) => r.day_of_week === day), [rows, day]);
  const update = (idx: number, patch: Partial<Row>) => setRows((p) => p.map((r, n) => (n === idx ? { ...r, ...patch } : r)));
  const addPeriod = () => {
    const last = dayRows[dayRows.length - 1]?.r;
    const start = last?.end_time || "08:00";
    const [h, m] = start.split(":").map(Number);
    const endM = h * 60 + m + 40;
    setRows((p) => [...p, { day_of_week: day, start_time: start, end_time: `${String(Math.floor(endM / 60)).padStart(2, "0")}:${String(endM % 60).padStart(2, "0")}`, subject_id: "", room: "" }]);
  };
  const remove = async (idx: number) => {
    const r = rows[idx];
    if (r.id) { const { error } = await supabase.from("schedules").delete().eq("id", r.id); if (error) return toast.error(error.message); }
    setRows((p) => p.filter((_, n) => n !== idx));
  };
  const saveAll = async () => {
    const bad = rows.find((r) => !r.start_time || !r.end_time || r.end_time <= r.start_time);
    if (bad) return toast.error(`Check the times on ${DAYS[bad.day_of_week - 1]} — each period must end after it starts.`);
    setSaving(true);
    for (const r of rows) {
      const payload = { class_id: classId, day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, subject_id: r.subject_id || null, room: r.room || null };
      const res = r.id ? await supabase.from("schedules").update(payload).eq("id", r.id) : await supabase.from("schedules").insert(payload);
      if (res.error) { setSaving(false); return toast.error(res.error.message); }
    }
    setSaving(false); toast.success("Timetable saved. Pupils and parents can see it now."); void load();
  };

  if (loading) return <div className="grid h-40 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((d, n) => <button key={d} onClick={() => setDay(n + 1)} className={cn("shrink-0 rounded-full px-4 py-2 text-xs font-bold transition", day === n + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{d.slice(0, 3)} <span className="opacity-70">({rows.filter((r) => r.day_of_week === n + 1).length})</span></button>)}
      </div>
      <div className="space-y-2">
        {dayRows.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No periods on {DAYS[day - 1]} yet.</p>}
        {dayRows.map(({ r, idx }) => (
          <div key={r.id || idx} className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-[110px_110px_1fr_120px_40px]">
            <Input type="time" value={r.start_time} onChange={(e) => update(idx, { start_time: e.target.value })} aria-label="Starts" />
            <Input type="time" value={r.end_time} onChange={(e) => update(idx, { end_time: e.target.value })} aria-label="Ends" />
            <Select value={r.subject_id || "break"} onValueChange={(v) => update(idx, { subject_id: v === "break" ? "" : v })}>
              <SelectTrigger className="col-span-2 sm:col-span-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="break">Break / assembly</SelectItem>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Room / note" value={r.room} onChange={(e) => update(idx, { room: e.target.value })} />
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(idx)} aria-label="Remove period"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addPeriod}><Plus className="mr-1 h-4 w-4" /> Add period</Button>
        <Button onClick={saveAll} disabled={saving}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save timetable</Button>
      </div>
    </div>
  );
};

export const TimetableViewer = ({ classId }: { classId?: string | null }) => {
  const [rows, setRows] = useState<any[]>([]);
  const today = new Date().getDay();
  const [day, setDay] = useState(today >= 1 && today <= 5 ? today : 1);
  useEffect(() => {
    if (!classId) return;
    supabase.from("schedules").select("id,day_of_week,start_time,end_time,room,subjects(name)").eq("class_id", classId).order("start_time").then(({ data }) => setRows(data || []));
  }, [classId]);
  if (!classId) return null;
  const list = rows.filter((r) => r.day_of_week === day);
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto">{DAYS.map((d, n) => <button key={d} onClick={() => setDay(n + 1)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-bold", day === n + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{d.slice(0, 3)}</button>)}</div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">The class timetable for {DAYS[day - 1]} hasn't been added yet.</p> :
        <ol className="space-y-1.5">{list.map((r) => <li key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"><span className="w-24 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}</span><span className="min-w-0 truncate text-sm font-semibold">{r.subjects?.name || "Break"}</span>{r.room && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{r.room}</span>}</li>)}</ol>}
    </div>
  );
};
