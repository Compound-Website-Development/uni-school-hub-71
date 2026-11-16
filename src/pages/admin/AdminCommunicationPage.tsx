import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, MessageSquareText, Plus, Trash2, Eye } from "lucide-react";
import { renderTemplate, TEMPLATE_PLACEHOLDERS } from "@/lib/finance";

const blank = { id: "", key: "", channel: "sms", name: "", subject: "", body: "" };

const PREVIEW_VALUES: Record<string, string> = {
  parent_name: "Mrs Adeyemi",
  student_name: "Chidera Adeyemi",
  class_name: "Primary 3",
  term: "Wisdom Term",
  balance: "₦45,000",
  due_date: "30 September 2026",
  date: "14 August 2026",
  title: "Mid-term break",
  body: "School closes on Friday and resumes the following Monday.",
};

const AdminCommunicationPage = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<typeof blank | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("message_templates").select("*").order("name");
    setTemplates(data || []);
    setIsLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.key || !editing.body) { toast.error("Key, name and body are required"); return; }
    setBusy(true);
    const payload = {
      key: editing.key.trim(),
      channel: editing.channel,
      name: editing.name.trim(),
      subject: editing.subject || null,
      body: editing.body,
      created_by: user?.id ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("message_templates").update(payload).eq("id", editing.id)
      : await supabase.from("message_templates").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Template saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template removed");
    load();
  };

  const toggleActive = async (t: any) => {
    await supabase.from("message_templates").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Communication">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Communication Templates">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">SMS & email templates</h2>
            <p className="text-sm text-muted-foreground">
              Used for fee reminders, attendance alerts and announcements. Placeholders:{" "}
              {TEMPLATE_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}
            </p>
          </div>
          <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => setEditing({ ...blank })}>
            <Plus className="w-4 h-4 mr-1.5" /> New template
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="border-border/50 shadow-card card-hover-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-primary" />
                  {t.name}
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase">{t.channel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[11px] font-mono text-muted-foreground">{t.key}</p>
                {t.subject && <p className="text-xs font-medium text-foreground">{t.subject}</p>}
                <p className="text-xs text-muted-foreground line-clamp-3">{t.body.replace(/<[^>]+>/g, " ")}</p>
                <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1 font-medium text-foreground mb-1"><Eye className="w-3 h-3" /> Preview</p>
                  {renderTemplate(t.body, PREVIEW_VALUES).replace(/<[^>]+>/g, " ")}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditing({
                    id: t.id, key: t.key, channel: t.channel, name: t.name, subject: t.subject || "", body: t.body,
                  })}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => toggleActive(t)}>
                    {t.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive ml-auto" onClick={() => remove(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No templates yet.</CardContent></Card>
          )}
        </div>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Key</Label>
                  <Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="fee_reminder" />
                </div>
                <div>
                  <Label className="text-xs">Channel</Label>
                  <Select value={editing.channel} onValueChange={(v) => setEditing({ ...editing, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label className="text-xs">Subject (email)</Label><Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Body</Label>
                <Textarea rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                {renderTemplate(editing.body || "", PREVIEW_VALUES).replace(/<[^>]+>/g, " ") || "Preview appears here."}
              </div>
              <Button className="w-full shadow-md" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null} Save template
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCommunicationPage;
