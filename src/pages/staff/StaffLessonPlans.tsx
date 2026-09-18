import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpenCheck, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAssignedClass } from "@/hooks/useAssignedClass";

const StaffLessonPlans = () => {
  const { user, teacherData } = useAuth();
  const { assignedClass, isLoading: isClassLoading } = useAssignedClass();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: "", topic: "", objectives: "", activities: "", resources: "", homework_assigned: "", subject_id: "" });

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, subRes] = await Promise.all([
        supabase.from("lesson_plans").select("*, classes(name), subjects(name)").order("date", { ascending: false }),
        supabase.from("subjects").select("*"),
      ]);
      setPlans(plansRes.data || []);
      setSubjects(subRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!assignedClass) { toast({ title: "No class assigned", description: "Ask an administrator to assign your class first.", variant: "destructive" }); return; }
    if (!form.topic || !form.date) { toast({ title: "Topic and date required", variant: "destructive" }); return; }
    const { error } = await supabase.from("lesson_plans").insert({
      teacher_id: teacherData?.id, class_id: assignedClass.id, subject_id: form.subject_id || null,
      date: form.date, topic: form.topic, objectives: form.objectives, activities: form.activities,
      resources: form.resources, homework_assigned: form.homework_assigned,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lesson plan created" });
    setForm({ date: "", topic: "", objectives: "", activities: "", resources: "", homework_assigned: "", subject_id: "" });
    setDialogOpen(false);
    const { data } = await supabase.from("lesson_plans").select("*, classes(name), subjects(name)").order("date", { ascending: false });
    setPlans(data || []);
  };

  if (isLoading || isClassLoading) {
    return <StaffLayout title="Lesson Plans"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StaffLayout>;
  }

  return (
    <StaffLayout title="Lesson Plans">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Lesson Plans</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button disabled={!assignedClass}><Plus className="w-4 h-4 mr-2" /> New Plan</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Lesson Plan</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <Input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Assigned class</span>
                  <span className="ml-2 font-semibold text-foreground">{assignedClass?.name || "Not assigned"}</span>
                </div>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Objectives" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={2} />
                <Textarea placeholder="Activities" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} rows={2} />
                <Input placeholder="Resources needed" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} />
                <Input placeholder="Homework assigned" value={form.homework_assigned} onChange={(e) => setForm({ ...form, homework_assigned: e.target.value })} />
                <Button onClick={handleCreate} className="w-full">Create Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {plans.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><BookOpenCheck className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No lesson plans yet.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => (
              <Card key={p.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{p.topic}</h3>
                      <p className="text-xs text-muted-foreground">{p.classes?.name} · {p.subjects?.name} · {new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {p.objectives && <p className="text-sm mt-2"><strong>Objectives:</strong> {p.objectives}</p>}
                  {p.activities && <p className="text-sm"><strong>Activities:</strong> {p.activities}</p>}
                  {p.homework_assigned && <p className="text-sm"><strong>Homework:</strong> {p.homework_assigned}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffLessonPlans;
