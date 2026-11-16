import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarOff, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const StaffLeave = () => {
  const { teacherData } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!teacherData) { setIsLoading(false); return; }
      const { data } = await supabase.from("leave_requests").select("*").eq("teacher_id", teacherData.id).order("created_at", { ascending: false });
      setLeaves(data || []);
      setIsLoading(false);
    };
    fetchLeaves();
  }, [teacherData]);

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date || !form.reason || !teacherData) { toast({ title: "All fields required", variant: "destructive" }); return; }
    const { error } = await supabase.from("leave_requests").insert({
      teacher_id: teacherData.id, start_date: form.start_date, end_date: form.end_date, reason: form.reason,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Leave request submitted" });
    setForm({ start_date: "", end_date: "", reason: "" }); setDialogOpen(false);
    const { data } = await supabase.from("leave_requests").select("*").eq("teacher_id", teacherData.id).order("created_at", { ascending: false });
    setLeaves(data || []);
  };

  const statusColor = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

  if (isLoading) {
    return <StaffLayout title="Leave"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></StaffLayout>;
  }

  return (
    <StaffLayout title="Leave Management">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">My Leave Requests</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Request Leave</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium">Start Date</label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><label className="text-sm font-medium">End Date</label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <Textarea placeholder="Reason for leave" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
                <Button onClick={handleSubmit} className="w-full">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {leaves.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><CalendarOff className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No leave requests.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <Card key={l.id} className="border-border/50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{l.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(l.start_date).toLocaleDateString()} — {new Date(l.end_date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={statusColor(l.status)} className="capitalize">{l.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffLeave;
