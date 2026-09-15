import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const StudentComplaints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal" });

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!user) return;
      const { data } = await supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setComplaints(data || []);
      setIsLoading(false);
    };
    fetchComplaints();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.subject || !form.description || !user) { toast({ title: "All fields required", variant: "destructive" }); return; }
    const { error } = await supabase.from("complaints").insert({ user_id: user.id, subject: form.subject, description: form.description, priority: form.priority });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Complaint submitted" });
    setForm({ subject: "", description: "", priority: "normal" }); setDialogOpen(false);
    const { data } = await supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setComplaints(data || []);
  };

  const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

  if (isLoading) {
    return <StudentLayout title="Complaints"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StudentLayout>;
  }

  return (
    <StudentLayout title="Complaints">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">My Complaints</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Complaint</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Complaint</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                <Textarea placeholder="Describe your complaint..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSubmit} className="w-full">Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {complaints.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><AlertTriangle className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No complaints submitted.</p></CardContent></Card>
        ) : complaints.map((c) => (
          <Card key={c.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm">{c.subject}</h3>
                <div className="flex gap-2">
                  <Badge variant={statusColor(c.status)} className="capitalize text-xs">{c.status}</Badge>
                  <Badge variant="outline" className="capitalize text-xs">{c.priority}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(c.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudentLayout>
  );
};

export default StudentComplaints;
