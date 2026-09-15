import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Plus, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const StaffAssignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", class_id: "", subject_id: "", due_date: "" });

  useEffect(() => {
    const fetchData = async () => {
      const [assignRes, classRes, subRes] = await Promise.all([
        supabase.from("assignments").select("*, classes(name), subjects(name)").order("created_at", { ascending: false }),
        supabase.from("classes").select("*"),
        supabase.from("subjects").select("*"),
      ]);
      setAssignments(assignRes.data || []);
      setClasses(classRes.data || []);
      setSubjects(subRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.due_date) { toast({ title: "Title and due date required", variant: "destructive" }); return; }
    const { error } = await supabase.from("assignments").insert({
      title: form.title, description: form.description,
      class_id: form.class_id || null, subject_id: form.subject_id || null,
      due_date: form.due_date, created_by: user?.id,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Assignment created" });
    setForm({ title: "", description: "", class_id: "", subject_id: "", due_date: "" });
    setDialogOpen(false);
    const { data } = await supabase.from("assignments").select("*, classes(name), subjects(name)").order("created_at", { ascending: false });
    setAssignments(data || []);
  };

  if (isLoading) {
    return <StaffLayout title="Assignments"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StaffLayout>;
  }

  return (
    <StaffLayout title="Assignments">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Homework & Assignments</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Assignment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Textarea placeholder="Instructions" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {assignments.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><ClipboardList className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No assignments yet.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((a) => (
              <Card key={a.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <Badge variant="outline" className="text-xs">{a.classes?.name || "All"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{a.description || "No description"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                  </div>
                  {a.subjects?.name && <Badge className="mt-2 text-xs" variant="secondary">{a.subjects.name}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffAssignments;
