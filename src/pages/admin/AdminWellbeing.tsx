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
import { Heart, Plus, Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const AdminWellbeing = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", session_type: "individual", reason: "", notes: "", follow_up_date: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [sessionsRes, studentsRes] = await Promise.all([
      supabase.from("counseling_sessions").select("*, students(first_name, last_name, student_id)").order("session_date", { ascending: false }),
      supabase.from("students").select("id, first_name, last_name, student_id").eq("status", "active"),
    ]);
    setSessions(sessionsRes.data || []);
    setStudents(studentsRes.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.reason) { toast.error("Fill required fields"); return; }
    const { error } = await supabase.from("counseling_sessions").insert({
      student_id: form.student_id,
      session_type: form.session_type,
      reason: form.reason,
      notes: form.notes || null,
      follow_up_date: form.follow_up_date || null,
    });
    if (error) { toast.error("Failed to save session"); return; }
    toast.success("Counseling session scheduled");
    setDialogOpen(false);
    setForm({ student_id: "", session_type: "individual", reason: "", notes: "", follow_up_date: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("counseling_sessions").update({ status }).eq("id", id);
    toast.success("Session updated");
    fetchData();
  };

  const statusColor: Record<string, string> = {
    scheduled: "bg-info/10 text-info border-info/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground",
    "follow-up": "bg-warning/10 text-warning border-warning/20",
  };

  const stats = {
    total: sessions.length,
    scheduled: sessions.filter((s) => s.status === "scheduled").length,
    completed: sessions.filter((s) => s.status === "completed").length,
    needsFollowUp: sessions.filter((s) => s.follow_up_date && s.status !== "completed").length,
  };

  if (isLoading) {
    return <AdminLayout title="Student Wellbeing"><div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Student Wellbeing">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Heart className="w-6 h-6 text-pink" /> Student Wellbeing</h2>
            <p className="text-sm text-muted-foreground mt-1">Counseling sessions, mental health tracking, and student support</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Schedule Session</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Schedule Counseling Session</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Session Type</Label>
                  <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="crisis">Crisis Intervention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for session..." /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Session notes (confidential)" /></div>
                <div><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSubmit}>Schedule Session</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div><div><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Sessions</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-info/10"><Calendar className="w-4 h-4 text-info" /></div><div><p className="text-xl font-bold text-info">{stats.scheduled}</p><p className="text-xs text-muted-foreground">Scheduled</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></div><div><p className="text-xl font-bold text-success">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="w-4 h-4 text-warning" /></div><div><p className="text-xl font-bold text-warning">{stats.needsFollowUp}</p><p className="text-xs text-muted-foreground">Needs Follow-up</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Counseling Sessions</CardTitle></CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{session.students?.first_name} {session.students?.last_name}</p>
                          <Badge className={statusColor[session.status] || ""}>{session.status}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{session.session_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{session.reason}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(session.session_date).toLocaleDateString()}</p>
                        {session.follow_up_date && <p className="text-[10px] text-warning mt-0.5">Follow-up: {new Date(session.follow_up_date).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex gap-1.5">
                        {session.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(session.id, "completed")}>Complete</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No counseling sessions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWellbeing;
