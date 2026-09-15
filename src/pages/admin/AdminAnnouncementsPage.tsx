import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminAnnouncementsPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [priority, setPriority] = useState("normal");

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Title and body are required"); return; }
    const { error } = await supabase.from("announcements").insert({
      title, body, target_role: targetRole, priority, created_by: user?.id, is_published: true
    });
    if (!error) {
      toast.success("Announcement published");
      setTitle(""); setBody(""); setTargetRole("all"); setPriority("normal");
      setDialogOpen(false);
      fetchAnnouncements();
    } else {
      toast.error("Failed to create announcement");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) { toast.success("Deleted"); fetchAnnouncements(); }
  };

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-5 animate-fade-in">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Broadcast messages to students and staff.</p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary"><Plus className="w-4 h-4 mr-1" /> New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label className="text-xs">Message</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Target Audience</Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                        <SelectItem value="teacher">Staff Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">Publish Announcement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="card-hover-subtle">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      <Badge variant="outline" className="text-[10px] capitalize">{a.target_role}</Badge>
                      {a.priority === "urgent" && <Badge className="text-[10px] bg-destructive">Urgent</Badge>}
                      {a.priority === "high" && <Badge className="text-[10px] bg-warning">High</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {announcements.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No announcements yet</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncementsPage;
