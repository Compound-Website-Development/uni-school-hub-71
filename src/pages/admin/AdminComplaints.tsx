import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminComplaints = () => {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    const { data } = await supabase.from("complaints").select("*").order("created_at", { ascending: false });
    setComplaints(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    await supabase.from("complaints").update(update).eq("id", id);
    toast({ title: `Status updated to ${status}` });
    fetchComplaints();
  };

  const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";
  const priorityColor = (p: string) => p === "high" ? "text-destructive" : p === "normal" ? "text-warning" : "text-muted-foreground";

  if (isLoading) {
    return <AdminLayout title="Complaints"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Complaint Management">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold">All Complaints</h2>
        {complaints.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><AlertTriangle className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No complaints.</p></CardContent></Card>
        ) : complaints.map((c) => (
          <Card key={c.id} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{c.subject}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-xs font-medium capitalize ${priorityColor(c.priority)}`}>{c.priority}</span>
                  <Badge variant={statusColor(c.status)} className="capitalize">{c.status}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
              <Select value={c.status} onValueChange={(v) => updateStatus(c.id, v)}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminComplaints;
