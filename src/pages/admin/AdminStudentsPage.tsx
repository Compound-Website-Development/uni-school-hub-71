import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import StudentPhoto from "@/components/StudentPhoto";
import { Search, Plus, Eye, Edit, UserX, UserCheck, GraduationCap, Upload, BadgeCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { StudentFormDialog, ClassOption } from "@/components/admin/StudentFormDialog";

const ALL = "__all__";

const AdminStudentsPage = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(ALL);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);

  const fetchStudents = useCallback(async () => {
    const { data } = await supabase
      .from("students")
      .select("*, classes(name), programmes(name)")
      .order("created_at", { ascending: false });
    setStudents(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
    supabase.from("classes").select("id, name, level, arm").order("name").then(({ data }) => setClasses(data || []));
  }, [fetchStudents]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("students").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "active" ? "Student reactivated" : "Student deactivated");
      fetchStudents();
    }
  };

  const reassignClass = async (id: string, classId: string) => {
    const { error } = await supabase.from("students").update({ class_id: classId === ALL ? null : classId }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Class updated");
      fetchStudents();
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch = `${s.first_name} ${s.last_name} ${s.student_id} ${s.guardian_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesClass = classFilter === ALL || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <AdminLayout title="Manage Students" showSearch>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, admission no, parent..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-9 w-full sm:w-52 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{filtered.length} students</Badge>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/admin/register-import"><Upload className="w-4 h-4" /> Import register</Link>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4" /> Add student
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Admission No.</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Parent / Guardian</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono">{s.student_id}</TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                          <StudentPhoto
                            photoRef={s.photo_url}
                            alt={`${s.first_name} ${s.last_name}`}
                            fallback={<User className="w-3.5 h-3.5 text-muted-foreground/50" />}
                          />
                        </div>
                        <span>{s.first_name} {s.last_name}</span>
                        {s.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={s.class_id || ALL} onValueChange={(v) => reassignClass(s.id, v)}>
                        <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Unassigned</SelectItem>
                          {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.guardian_name || "—"}
                      {s.guardian_phone && <span className="block text-muted-foreground">{s.guardian_phone}</span>}
                    </TableCell>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setStatus(s.id, "inactive")}>
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => setStatus(s.id, "active")}>
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editing} classes={classes} onSaved={fetchStudents} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.first_name} {viewing?.last_name}</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Admission No.", viewing.student_id],
                ["Class", viewing.classes?.name || "Unassigned"],
                ["Gender", viewing.gender],
                ["Date of birth", viewing.date_of_birth],
                ["Admission date", viewing.admission_date],
                ["Address", viewing.address],
                ["Parent / guardian", viewing.guardian_name],
                ["Relationship", viewing.guardian_relation],
                ["Parent phone", viewing.guardian_phone],
                ["Parent email", viewing.guardian_email],
                ["Parent phone (2nd)", viewing.parent_phone],
                ["Parent ID", viewing.parent_id],
                ["Parent access code", viewing.parent_code],
                ["Verified", viewing.is_verified ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium break-words">{(v as string) || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStudentsPage;
