import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Edit, Briefcase, Plus, UserX, UserCheck, KeyRound, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { StaffFormDialog } from "@/components/admin/StaffFormDialog";

const AdminStaffPage = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [accounts, setAccounts] = useState<any[] | null>(null);


  const fetchStaff = useCallback(async () => {
    const { data } = await (supabase as any).rpc("staff_teacher_records");
    setStaff([...(data || [])].sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || "")));
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("teachers").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "active" ? "Staff member reactivated" : "Staff member deactivated");
      fetchStaff();
    }
  };

  const provisionLogins = async () => {
    setProvisioning(true);
    const { data, error } = await supabase.functions.invoke("provision-staff-accounts");
    setProvisioning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAccounts(data?.accounts || []);
    const created = (data?.accounts || []).filter((a: any) => a.status === "created").length;
    toast.success(created ? `${created} staff login(s) created` : "All staff already have logins");
    fetchStaff();
  };

  const copyCredentials = () => {
    const text = (accounts || [])
      .map((a) => `${a.name} — ${a.email} — ${a.password || "(existing password)"}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  const downloadCredentials = () => {
    const rows = [["Name", "Email", "Password", "Department", "Status"]]
      .concat((accounts || []).map((a) => [a.name, a.email, a.password || "", a.department || "", a.status]))
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "imagemakers-staff-logins.csv";
    link.click();
    URL.revokeObjectURL(url);
  };


  const filtered = staff.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.employee_id || ""} ${s.department || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manage Staff">
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{filtered.length} staff members</Badge>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={provisionLogins} disabled={provisioning}>
              {provisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Create staff logins
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" /> Add staff
            </Button>
          </div>
        </div>


        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono">{s.employee_id || "—"}</TableCell>
                    <TableCell className="text-sm font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell className="text-xs">{s.email || "—"}</TableCell>
                    <TableCell className="text-xs">{s.department || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {s.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewing(s)}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setFormOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                        {s.status === "active" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setStatus(s.id, "inactive")}><UserX className="w-3.5 h-3.5" /></Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => setStatus(s.id, "active")}><UserCheck className="w-3.5 h-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No staff members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StaffFormDialog open={formOpen} onOpenChange={setFormOpen} staff={editing} onSaved={fetchStaff} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.first_name} {viewing?.last_name}</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Employee ID", viewing.employee_id],
                ["Department", viewing.department],
                ["Qualification", viewing.qualification],
                ["Email", viewing.email],
                ["Phone", viewing.phone],
                ["Gender", viewing.gender],
                ["Date of birth", viewing.date_of_birth],
                ["Hire date", viewing.hire_date],
                ["Address", viewing.address],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{(v as string) || "—"}</dd>
                </div>
              ))}
              {viewing.bio && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Bio</dt>
                  <dd className="font-medium">{viewing.bio}</dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!accounts} onOpenChange={(v) => !v && setAccounts(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Staff login credentials</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            Passwords are shown once. Copy or download them now and share with each teacher — they can change it after signing in.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={copyCredentials}><Copy className="w-3.5 h-3.5" /> Copy all</Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadCredentials}><Download className="w-3.5 h-3.5" /> Download CSV</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Password</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts || []).map((a) => (
                <TableRow key={a.email}>
                  <TableCell className="text-xs font-medium">{a.name}</TableCell>
                  <TableCell className="text-xs">{a.email}</TableCell>
                  <TableCell className="text-xs font-mono">{a.password || "—"}</TableCell>
                  <TableCell className="text-[10px] capitalize">{String(a.status).replace(/_/g, " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </AdminLayout>

  );
};

export default AdminStaffPage;
