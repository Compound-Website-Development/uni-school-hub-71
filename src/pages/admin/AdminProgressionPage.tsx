import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, GraduationCap } from "lucide-react";

const ProgressionPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [session, setSession] = useState("2026/2027");
  const [decision, setDecision] = useState("promoted");
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedStudent = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);
  const className = (id?: string | null) => classes.find(c => c.id === id)?.name || (id ? "Unknown class" : "Not assigned");

  const load = async () => {
    const [s, c, h] = await Promise.all([
      supabase.from("students").select("id,student_id,first_name,last_name,class_id,status").eq("status","active").order("last_name"),
      supabase.from("classes").select("id,name,arm").order("name"),
      supabase.from("student_progression_history").select("*, students(first_name,last_name,student_id), previous_class:classes!student_progression_history_previous_class_id_fkey(name,arm), new_class:classes!student_progression_history_new_class_id_fkey(name,arm)").order("decision_date",{ascending:false}).limit(500),
    ]);
    if (s.error || c.error || h.error) toast.error("Some progression records could not be loaded. Confirm the migration has been applied and admin access is enabled.");
    setStudents(s.data || []);
    setClasses(c.data || []);
    setHistory(h.data || []);
  };

  useEffect(() => { void load(); }, []);

  const chooseStudent = (id: string) => {
    setStudentId(id);
    setNewClassId(students.find(s => s.id === id)?.class_id || "unassigned");
  };

  const save = async () => {
    if (!studentId || !session.trim()) { toast.error("Choose a pupil and enter the academic session."); return; }
    if (decision !== "repeated" && newClassId === "unassigned") { toast.error("Choose the pupil's new class."); return; }
    setSaving(true);
    const { error } = await (supabase as any).rpc("record_student_progression", {
      _student_id: studentId,
      _new_class_id: newClassId === "unassigned" ? null : newClassId,
      _academic_session: session.trim(),
      _decision: decision,
      _decision_date: decisionDate,
      _notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Progression decision saved and the pupil's current class updated.");
    setNotes("");
    await load();
  };

  return <AdminLayout title="Promotion & Progression">
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold">Promotion, repetition and demotion</h2><p className="text-sm text-muted-foreground">Every decision records the previous class, new class, academic session, date and decision. Saving updates the pupil's current class and history together.</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5"/>Record a decision</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <div><Label>Pupil</Label><Select value={studentId} onValueChange={chooseStudent}><SelectTrigger><SelectValue placeholder="Choose pupil"/></SelectTrigger><SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.student_id}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Decision</Label><Select value={decision} onValueChange={setDecision}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="promoted">Promoted</SelectItem><SelectItem value="repeated">Repeated class</SelectItem><SelectItem value="demoted">Demoted</SelectItem></SelectContent></Select></div>
        <div><Label>Previous class</Label><Input readOnly value={className(selectedStudent?.class_id)}/></div>
        <div><Label>New class</Label><Select value={newClassId} onValueChange={setNewClassId}><SelectTrigger><SelectValue placeholder="Choose class"/></SelectTrigger><SelectContent><SelectItem value="unassigned">Not assigned</SelectItem>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}{c.arm ? " — "+c.arm : ""}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Academic session</Label><Input value={session} onChange={e=>setSession(e.target.value)} placeholder="2026/2027"/></div>
        <div><Label>Decision date</Label><Input type="date" value={decisionDate} onChange={e=>setDecisionDate(e.target.value)}/></div>
        <div className="md:col-span-2"><Label>Notes (optional)</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Record the school's approved decision or supporting note."/></div>
        <div className="md:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save decision and update class"}</Button><p className="mt-2 text-xs text-muted-foreground">This records the school's decision; it does not decide promotion automatically. A repeated pupil must remain in the same class.</p></div>
      </CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="text-base">Progression history</CardTitle><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></div></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Pupil</th><th className="p-2">Session</th><th className="p-2">Previous class</th><th className="p-2">New class</th><th className="p-2">Decision</th><th className="p-2">Date</th><th className="p-2">Notes</th></tr></thead><tbody>{history.map(h=><tr key={h.id} className="border-b"><td className="p-2">{h.students?.first_name} {h.students?.last_name}<span className="block text-xs text-muted-foreground">{h.students?.student_id}</span></td><td className="p-2">{h.academic_session}</td><td className="p-2">{h.previous_class?.name || "Not assigned"}{h.previous_class?.arm ? " — "+h.previous_class.arm : ""}</td><td className="p-2">{h.new_class?.name || "Not assigned"}{h.new_class?.arm ? " — "+h.new_class.arm : ""}</td><td className="p-2"><Badge variant="outline">{h.decision}</Badge></td><td className="p-2">{h.decision_date}</td><td className="p-2 max-w-[240px] whitespace-normal">{h.notes||"—"}</td></tr>)}{!history.length&&<tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No progression decisions have been recorded yet.</td></tr>}</tbody></table></CardContent></Card>
    </div>
  </AdminLayout>;
};

export default ProgressionPage;
