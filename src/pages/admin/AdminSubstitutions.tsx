import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Plus, Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const AdminSubstitutions = () => {
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ schedule_id: "", substitute_teacher_id: "", date: "", reason: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [subsRes, teachersRes, schedulesRes] = await Promise.all([
      supabase.from("substitutions").select("*, schedules(*, subjects(name), classes(name)), teachers!substitutions_original_teacher_id_fkey(first_name, last_name)").order("date", { ascending: false }),
      supabase.from("teachers").select("id, first_name, last_name").eq("status", "active"),
      supabase.from("schedules").select("id, classes(name), subjects(name), day_of_week, start_time, end_time, teacher_id, teachers(first_name, last_name)"),
    ]);
    setSubstitutions(subsRes.data || []);
    setTeachers(teachersRes.data || []);
    setSchedules(schedulesRes.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.schedule_id || !form.substitute_teacher_id || !form.date) { toast.error("Fill all required fields"); return; }
    const schedule = schedules.find((s) => s.id === form.schedule_id);
    const { error } = await supabase.from("substitutions").insert({
      schedule_id: form.schedule_id,
      original_teacher_id: schedule?.teacher_id || null,
      substitute_teacher_id: form.substitute_teacher_id,
      date: form.date,
      reason: form.reason || null,
      status: "approved",
    });
    if (error) { toast.error("Failed to create substitution"); return; }
    toast.success("Substitution scheduled");
    setDialogOpen(false);
    setForm({ schedule_id: "", substitute_teacher_id: "", date: "", reason: "" });
    fetchData();
  };

  const stats = {
    total: substitutions.length,
    pending: substitutions.filter((s) => s.status === "pending").length,
    approved: substitutions.filter((s) => s.status === "approved").length,
  };

  if (isLoading) {
    return <AdminLayout title="Substitutions"><div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div></AdminLayout>;
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <AdminLayout title="Teacher Substitutions">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><RefreshCw className="w-6 h-6 text-primary" /> Teacher Substitutions</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage temporary teacher replacements for scheduled classes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Create Substitution</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Schedule Substitution</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Class Schedule</Label>
                  <Select value={form.schedule_id} onValueChange={(v) => setForm({ ...form, schedule_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                    <SelectContent>
                      {schedules.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.classes?.name} — {s.subjects?.name} ({days[s.day_of_week]} {s.start_time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Substitute Teacher</Label>
                  <Select value={form.substitute_teacher_id} onValueChange={(v) => setForm({ ...form, substitute_teacher_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for substitution" /></div>
                <Button className="w-full" onClick={handleSubmit}>Schedule Substitution</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div><div><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="w-4 h-4 text-warning" /></div><div><p className="text-xl font-bold text-warning">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></div><div><p className="text-xl font-bold text-success">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Substitution Records</CardTitle></CardHeader>
          <CardContent>
            {substitutions.length > 0 ? (
              <div className="space-y-3">
                {substitutions.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{sub.schedules?.classes?.name} — {sub.schedules?.subjects?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Original: {sub.teachers?.first_name} {sub.teachers?.last_name} · Date: {new Date(sub.date).toLocaleDateString()}
                        </p>
                        {sub.reason && <p className="text-xs text-muted-foreground mt-0.5">Reason: {sub.reason}</p>}
                      </div>
                      <Badge className={sub.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{sub.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No substitutions recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubstitutions;
