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
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const AdminBehavioral = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", category: "general", severity: "minor", description: "", action_taken: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [recordsRes, studentsRes] = await Promise.all([
      supabase.from("behavioral_records").select("*, students(first_name, last_name, student_id)").order("created_at", { ascending: false }),
      supabase.from("students").select("id, first_name, last_name, student_id").eq("status", "active"),
    ]);
    setRecords(recordsRes.data || []);
    setStudents(studentsRes.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.student_id || !form.description) { toast.error("Fill required fields"); return; }
    const { error } = await supabase.from("behavioral_records").insert({
      student_id: form.student_id,
      category: form.category,
      severity: form.severity,
      description: form.description,
      action_taken: form.action_taken || null,
    });
    if (error) { toast.error("Failed to save record"); return; }
    toast.success("Behavioral record saved");
    setDialogOpen(false);
    setForm({ student_id: "", category: "general", severity: "minor", description: "", action_taken: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("behavioral_records").update({ status }).eq("id", id);
    toast.success("Status updated");
    fetchData();
  };

  const severityColor: Record<string, string> = {
    minor: "bg-info/10 text-info border-info/20",
    moderate: "bg-warning/10 text-warning border-warning/20",
    major: "bg-destructive/10 text-destructive border-destructive/20",
    critical: "bg-destructive text-destructive-foreground",
  };

  const stats = {
    total: records.length,
    open: records.filter((r) => r.status === "open").length,
    resolved: records.filter((r) => r.status === "resolved").length,
    critical: records.filter((r) => r.severity === "critical" || r.severity === "major").length,
  };

  if (isLoading) {
    return <AdminLayout title="Behavioral Records"><div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Behavioral Records">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Behavioral & Discipline</h2>
            <p className="text-sm text-muted-foreground mt-1">Track incidents, behavioral patterns, and disciplinary actions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Log Incident</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Log Behavioral Incident</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="bullying">Bullying</SelectItem>
                        <SelectItem value="truancy">Truancy</SelectItem>
                        <SelectItem value="misconduct">Misconduct</SelectItem>
                        <SelectItem value="positive">Positive Behavior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident..." /></div>
                <div><Label>Action Taken</Label><Input value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} placeholder="e.g. Warning issued, Parent contacted" /></div>
                <Button className="w-full" onClick={handleSubmit}>Save Record</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="w-4 h-4 text-primary" /></div><div><p className="text-xl font-bold text-foreground">{stats.total}</p><p className="text-xs text-muted-foreground">Total Records</p></div></CardContent></Card>
          <Card className="border-warning/20"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="w-4 h-4 text-warning" /></div><div><p className="text-xl font-bold text-warning">{stats.open}</p><p className="text-xs text-muted-foreground">Open Cases</p></div></CardContent></Card>
          <Card className="border-success/20"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></div><div><p className="text-xl font-bold text-success">{stats.resolved}</p><p className="text-xs text-muted-foreground">Resolved</p></div></CardContent></Card>
          <Card className="border-destructive/20"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-4 h-4 text-destructive" /></div><div><p className="text-xl font-bold text-destructive">{stats.critical}</p><p className="text-xs text-muted-foreground">Critical/Major</p></div></CardContent></Card>
        </div>

        {/* Records List */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent Records</CardTitle></CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-foreground">
                            {record.students?.first_name} {record.students?.last_name}
                          </p>
                          <Badge className={severityColor[record.severity] || ""}>{record.severity}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{record.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{record.description}</p>
                        {record.action_taken && <p className="text-xs text-muted-foreground mt-1">Action: {record.action_taken}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(record.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {record.status === "open" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(record.id, "resolved")}>Resolve</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No behavioral records yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBehavioral;
