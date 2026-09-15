import { useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FileText, Loader2, RefreshCw, Search, Upload, Download } from "lucide-react";

const BUCKET = "student-photos";

type DocRow = {
  id: string;
  title: string;
  source: "policy" | "resource";
  category: string;
  version: string | null;
  storage_path: string | null;
  created_at: string;
  published: boolean;
};

/**
 * One place for every school document held in private storage — policy documents
 * and academic resources. Admins can open (short-lived signed URL), download and
 * replace a file in place; replacing bumps the stored version.
 */
const AdminDocumentsPage = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | "policy" | "resource">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const replacing = useRef<DocRow | null>(null);

  const load = async () => {
    const [policies, resources] = await Promise.all([
      supabase.from("policy_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("academic_resources").select("*").order("created_at", { ascending: false }),
    ]);
    const rows: DocRow[] = [
      ...(policies.data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        source: "policy" as const,
        category: d.category,
        version: d.version,
        storage_path: d.storage_path,
        created_at: d.created_at,
        published: !!d.is_published,
      })),
      ...(resources.data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        source: "resource" as const,
        category: "academic resource",
        version: null,
        storage_path: d.file_url,
        created_at: d.created_at,
        published: !!d.is_published,
      })),
    ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    setDocs(rows);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      docs.filter(
        (d) =>
          (source === "all" || d.source === source) &&
          (query.trim() === "" || d.title.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [docs, query, source],
  );

  const signedUrl = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Could not open the document");
      return null;
    }
    return data.signedUrl;
  };

  const open = async (d: DocRow) => {
    if (!d.storage_path) return;
    if (/^https?:\/\//.test(d.storage_path)) { window.open(d.storage_path, "_blank"); return; }
    const url = await signedUrl(d.storage_path);
    if (url) window.open(url, "_blank");
  };

  const download = async (d: DocRow) => {
    if (!d.storage_path) return;
    const url = /^https?:\/\//.test(d.storage_path) ? d.storage_path : await signedUrl(d.storage_path);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = d.title.replace(/[^\w.-]/g, "_");
    a.rel = "noopener";
    a.click();
  };

  const startReplace = (d: DocRow) => {
    replacing.current = d;
    fileInput.current?.click();
  };

  const onFilePicked = async (file: File | null) => {
    const target = replacing.current;
    replacing.current = null;
    if (fileInput.current) fileInput.current.value = "";
    if (!file || !target) return;

    setBusyId(target.id);
    const folder = target.source === "policy" ? "policies" : "resources";
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (upErr) {
      setBusyId(null);
      toast.error(`Upload failed: ${upErr.message}`);
      return;
    }

    let error: { message: string } | null = null;
    if (target.source === "policy") {
      const nextVersion = (() => {
        const n = Number(String(target.version ?? "v1").replace(/\D/g, "")) || 1;
        return `v${n + 1}`;
      })();
      ({ error } = await supabase
        .from("policy_documents")
        .update({ storage_path: path, version: nextVersion, uploaded_by: user?.id ?? null })
        .eq("id", target.id));
    } else {
      ({ error } = await supabase
        .from("academic_resources")
        .update({ file_url: path })
        .eq("id", target.id));
    }
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Replaced the file for “${target.title}”`);
    load();
  };

  return (
    <AdminLayout title="All Documents">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">School documents</h2>
            <p className="text-sm text-muted-foreground">
              Every policy document and academic resource held in private storage. Links are signed and expire
              after five minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search documents"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All documents</SelectItem>
                <SelectItem value="policy">Policy documents</SelectItem>
                <SelectItem value="resource">Academic resources</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-1.5" /> Refresh</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
            No documents match this filter yet. Upload policies from the Policy Documents page.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <Card key={`${d.source}-${d.id}`} className="border-border/50 shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="flex-1">{d.title}</span>
                    {d.version && <Badge variant="outline" className="text-[10px]">{d.version}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] capitalize">{d.category}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{d.source}</Badge>
                    {!d.storage_path && <Badge variant="destructive" className="text-[10px]">No file</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(d.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="text-xs" disabled={!d.storage_path} onClick={() => open(d)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" disabled={!d.storage_path} onClick={() => download(d)}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs ml-auto" disabled={busyId === d.id} onClick={() => startReplace(d)}>
                      {busyId === d.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                      Replace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
      />
    </AdminLayout>
  );
};

export default AdminDocumentsPage;
