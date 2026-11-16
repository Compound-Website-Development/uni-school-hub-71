import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ASSESSMENT_WEIGHTS, GRADE_BANDS } from "@/lib/schoolConfig";

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [subjects, setSubjects] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [weights, setWeights] = useState({ ca: ASSESSMENT_WEIGHTS.ca, exam: ASSESSMENT_WEIGHTS.exam });
  const [bands, setBands] = useState<any[]>(GRADE_BANDS.map((b) => ({ min: b.min, max: b.max, remark: b.remark })));
  const [newSubject, setNewSubject] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newProgramme, setNewProgramme] = useState("");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [programmeOpen, setProgrammeOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [settingsRes, subjectsRes, programmesRes, termsRes] = await Promise.all([
      supabase.from("school_settings").select("key,value"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("programmes").select("*").order("name"),
      supabase.from("terms").select("*").order("term_number"),
    ]);
    if (settingsRes.error || subjectsRes.error || programmesRes.error || termsRes.error) {
      toast.error("Some settings could not be loaded.");
    }
    const map: Record<string, string> = {};
    (settingsRes.data || []).forEach((row: any) => { map[row.key] = row.value || ""; });
    setSettings(map);
    try { if (map.assessment_weights) setWeights(JSON.parse(map.assessment_weights)); } catch { /* use approved defaults */ }
    try { if (map.grading_bands) setBands(JSON.parse(map.grading_bands)); } catch { /* use approved defaults */ }
    setSubjects(subjectsRes.data || []);
    setProgrammes(programmesRes.data || []);
    setTerms(termsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { void reload(); }, []);

  const saveSettings = async () => {
    const ca = Number(weights.ca), exam = Number(weights.exam);
    const sorted = [...bands].sort((a, b) => Number(a.min) - Number(b.min));
    if (ca <= 0 || exam <= 0 || ca + exam !== 100) {
      toast.error("CA and Exam weights must add up to 100."); return;
    }
    if (!sorted.length || Number(sorted[0].min) !== 0 || Number(sorted[sorted.length - 1].max) !== 100 ||
      sorted.some((b, i) => !b.remark?.trim() || Number(b.min) > Number(b.max) ||
        (i > 0 && Number(b.min) !== Number(sorted[i - 1].max) + 1))) {
      toast.error("Grading bands must cover 0–100 without gaps or overlaps."); return;
    }
    const rows = [
      ...Object.entries(settings).filter(([key]) => key !== "assessment_weights" && key !== "grading_bands").map(([key, value]) => ({ key, value, updated_by: user?.id })),
      { key: "assessment_weights", value: JSON.stringify(weights), updated_by: user?.id },
      { key: "grading_bands", value: JSON.stringify(sorted), updated_by: user?.id },
    ];
    const { error } = await supabase.from("school_settings").upsert(rows, { onConflict: "key" });
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved. Grade-entry logic must also consume these values before changing the live scoring formula.");
  };

  const updateTerm = async (term: any, patch: Record<string, any>) => {
    const { error } = await supabase.from("terms").update(patch as never).eq("id", term.id);
    if (error) { toast.error(error.message); return; }
    setTerms((current) => current.map((item) => item.id === term.id ? { ...item, ...patch } : item));
    toast.success("Term updated.");
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    const { error } = await supabase.from("subjects").insert({ name: newSubject.trim(), code: newCode.trim() || null });
    if (error) { toast.error(error.message); return; }
    setNewSubject(""); setNewCode(""); setSubjectOpen(false); await reload(); toast.success("Subject added.");
  };

  const addProgramme = async () => {
    if (!newProgramme.trim()) return;
    const { error } = await supabase.from("programmes").insert({ name: newProgramme.trim() });
    if (error) { toast.error(error.message); return; }
    setNewProgramme(""); setProgrammeOpen(false); await reload(); toast.success("Activity added.");
  };

  if (loading) return <AdminLayout title="School Settings"><p className="p-6 text-sm text-muted-foreground">Loading school settings…</p></AdminLayout>;

  return <AdminLayout title="School Settings">
    <div className="max-w-5xl space-y-5 animate-fade-in">
      <Tabs defaultValue="general">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="academic">Grading & Weights</TabsTrigger><TabsTrigger value="calendar">Academic Calendar</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger><TabsTrigger value="programmes">Clubs & Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><Card><CardHeader><CardTitle className="text-sm">General Settings</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          {["school_name","school_email","school_phone","school_address","current_session","school_motto","head_teacher_name"].map((key) =>
            <div key={key}><Label className="text-xs capitalize">{key.split("_").join(" ")}</Label><Input value={settings[key] || ""} onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}/></div>)}
        </CardContent></Card></TabsContent>
        <TabsContent value="registration"><Card><CardHeader><CardTitle className="text-sm">Registration Settings</CardTitle></CardHeader><CardContent>
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4"><div><p className="text-sm font-medium">Auto-approve registrations</p><p className="text-xs text-muted-foreground">Enable only if the school intends new registrations to become active without review.</p></div>
            <Switch checked={settings.auto_approve_registration === "true"} onCheckedChange={(v) => setSettings((s) => ({ ...s, auto_approve_registration: String(v) }))}/></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="academic"><Card><CardHeader><CardTitle className="text-sm">Assessment Weights</CardTitle></CardHeader><CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2"><div><Label>Continuous Assessment</Label><Input type="number" min="1" max="99" value={weights.ca} onChange={(e) => setWeights((w) => ({ ...w, ca: Number(e.target.value) }))}/></div>
            <div><Label>Examination</Label><Input type="number" min="1" max="99" value={weights.exam} onChange={(e) => setWeights((w) => ({ ...w, exam: Number(e.target.value) }))}/></div></div>
          <p className="text-xs text-muted-foreground">Current school-approved split is CA 40 / Exam 60. Changing these saved settings does not automatically change report-card calculations; the grade-entry and report-card services must read the same configuration before a new split is used.</p>
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Grading bands and remarks</h3><Button size="sm" variant="outline" onClick={() => setBands((b) => [...b, { min: 0, max: 0, remark: "" }])}><Plus className="mr-1 h-3 w-3"/>Add band</Button></div>
          <Table><TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Remark</TableHead><TableHead/></TableRow></TableHeader><TableBody>
            {bands.map((band, index) => <TableRow key={index}><TableCell><Input className="w-20" type="number" min="0" max="100" value={band.min} onChange={(e) => setBands((all) => all.map((b,i) => i === index ? { ...b, min: Number(e.target.value) } : b))}/></TableCell>
              <TableCell><Input className="w-20" type="number" min="0" max="100" value={band.max} onChange={(e) => setBands((all) => all.map((b,i) => i === index ? { ...b, max: Number(e.target.value) } : b))}/></TableCell>
              <TableCell><Input value={band.remark} onChange={(e) => setBands((all) => all.map((b,i) => i === index ? { ...b, remark: e.target.value } : b))}/></TableCell>
              <TableCell><Button size="icon" variant="ghost" onClick={() => setBands((all) => all.filter((_,i) => i !== index))}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>)}
          </TableBody></Table>
        </CardContent></Card></TabsContent>
        <TabsContent value="calendar"><Card><CardHeader><CardTitle className="text-sm">Academic Calendar & Term Dates</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Changes are saved per term. Only one term can be marked current.</p>
          {terms.map((term) => <div key={term.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-5">
            <div><Label className="text-xs">Term</Label><Input defaultValue={term.name} onBlur={(e) => e.target.value !== term.name && updateTerm(term,{name:e.target.value})}/></div>
            <div><Label className="text-xs">Session</Label><Input defaultValue={term.session || ""} onBlur={(e) => e.target.value !== (term.session || "") && updateTerm(term,{session:e.target.value})}/></div>
            <div><Label className="text-xs">Start</Label><Input type="date" defaultValue={term.start_date || ""} onBlur={(e) => e.target.value !== (term.start_date || "") && updateTerm(term,{start_date:e.target.value || null})}/></div>
            <div><Label className="text-xs">End</Label><Input type="date" defaultValue={term.end_date || ""} onBlur={(e) => e.target.value !== (term.end_date || "") && updateTerm(term,{end_date:e.target.value || null})}/></div>
            <div className="flex items-center gap-2"><Switch checked={!!term.is_current} onCheckedChange={async (checked) => { if (checked) { const { error } = await supabase.from("terms").update({is_current:false}).neq("id",term.id); if (error) { toast.error(error.message); return; } } await updateTerm(term,{is_current:checked}); }}/><Label className="text-xs">Current term</Label></div>
          </div>)}
          {!terms.length && <p className="text-sm text-muted-foreground">No term records found.</p>}
        </CardContent></Card></TabsContent>
        <TabsContent value="subjects"><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Subjects ({subjects.length})</CardTitle>
          <Dialog open={subjectOpen} onOpenChange={setSubjectOpen}><DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4"/>Add Subject</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader><div className="space-y-3"><Input placeholder="Subject name" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}/><Input placeholder="Subject code (optional)" value={newCode} onChange={(e) => setNewCode(e.target.value)}/><Button onClick={addSubject} className="w-full">Add Subject</Button></div></DialogContent></Dialog>
        </CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
          {subjects.map((subject) => <TableRow key={subject.id}><TableCell><Input defaultValue={subject.name} onBlur={async (e) => { if (e.target.value.trim() && e.target.value !== subject.name) { const {error}=await supabase.from("subjects").update({name:e.target.value.trim()}).eq("id",subject.id); if(error) toast.error(error.message); else setSubjects((s)=>s.map((x)=>x.id===subject.id?{...x,name:e.target.value.trim()}:x)); }}}/></TableCell>
            <TableCell><Input defaultValue={subject.code || ""} onBlur={async (e) => { const value=e.target.value.trim() || null; if(value !== subject.code) { const {error}=await supabase.from("subjects").update({code:value}).eq("id",subject.id); if(error) toast.error(error.message); else setSubjects((s)=>s.map((x)=>x.id===subject.id?{...x,code:value}:x)); }}}/></TableCell>
            <TableCell><Button size="icon" variant="ghost" onClick={async () => { const {error}=await supabase.from("subjects").delete().eq("id",subject.id); if(error) toast.error(error.message); else setSubjects((s)=>s.filter((x)=>x.id!==subject.id)); }}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>)}
        </TableBody></Table></CardContent></Card></TabsContent>
        <TabsContent value="programmes"><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Clubs & Extracurricular Activities</CardTitle>
          <Dialog open={programmeOpen} onOpenChange={setProgrammeOpen}><DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4"/>Add Activity</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add Club or Activity</DialogTitle></DialogHeader><Input placeholder="Activity name" value={newProgramme} onChange={(e)=>setNewProgramme(e.target.value)}/><Button className="w-full" onClick={addProgramme}>Add Activity</Button></DialogContent></Dialog>
        </CardHeader><CardContent><div className="space-y-2">{programmes.map((item)=><div key={item.id} className="flex items-center justify-between rounded border p-3"><span className="text-sm">{item.name}</span><Button size="icon" variant="ghost" onClick={async()=>{const {error}=await supabase.from("programmes").delete().eq("id",item.id);if(error)toast.error(error.message);else setProgrammes((p)=>p.filter((x)=>x.id!==item.id));}}><Trash2 className="h-4 w-4"/></Button></div>)}</div></CardContent></Card></TabsContent>
      </Tabs>
      <Button onClick={saveSettings}><Save className="mr-2 h-4 w-4"/>Save General & Academic Settings</Button>
    </div>
  </AdminLayout>;
};
export default AdminSettingsPage;
