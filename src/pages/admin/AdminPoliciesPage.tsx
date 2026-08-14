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
import { FileText, Loader2, Plus, Trash2, Download } from "lucide-react";

const CATEGORIES = ["finance", "records", "admissions", "staff", "safeguarding"];

const AdminPoliciesPage = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", category: "finance", version: "v1", description: "" });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("policy_documents").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
    setIsLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) { toast.error("Give the document a title"); return; }
    setBusy(true);
    let storagePath: string | null = null;
    if (file) {
      const path = `policies/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true });
      if (upErr) { setBusy(false); toast.error(`Upload failed: ${upErr.message}`); return; }
      storagePath = path;
    }
    const { error } = await supabase.from("policy_documents").insert({
      title: form.title.trim(),
      category: form.category,
      version: form.version || "v1",
      description: form.description || null,
      storage_path: storagePath,
      uploaded_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Policy document saved");
    setForm({ title: "", category: "finance", version: "v1", description: "" });
    setFile(null);
    setOpen(false);
    load();
  };

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("student-photos").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Could not open the document"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("policy_documents").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  if (isLoading) {
    return (
      <AdminLayout title="Policies">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Policy Documents">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Finance & records policies</h2>
            <p className="text-sm text-muted-foreground">Versioned documents the office and bursar can refer to.</p>
          </div>
          <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add document
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Card key={d.id} className="border-border/50 shadow-card card-hover-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="flex-1">{d.title}</span>
                  <Badge variant="outline" className="text-[10px]">{d.version}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className="text-[10px] capitalize">{d.category}</Badge>
                {d.description && <p className="text-xs text-muted-foreground line-clamp-3">{d.description}</p>}
                <div className="flex gap-2">
                  {d.storage_path && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => download(d.storage_path)}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Open
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs text-destructive ml-auto" onClick={() => remove(d.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {docs.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No policy documents yet.</CardContent></Card>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add policy document</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label className="text-xs">File (PDF or document)</Label>
              <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button className="w-full shadow-md" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null} Save document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPoliciesPage;
