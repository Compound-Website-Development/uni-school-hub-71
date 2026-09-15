import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staff?: any | null;
  onSaved: () => void;
}

const emptyForm = {
  employee_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department: "",
  qualification: "",
  gender: "",
  date_of_birth: "",
  hire_date: "",
  address: "",
  bio: "",
  status: "active",
};

export const generateEmployeeId = () =>
  `IMS/STF/${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

export const StaffFormDialog = ({ open, onOpenChange, staff, onSaved }: Props) => {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (staff) {
      setForm({
        ...emptyForm,
        ...Object.fromEntries(Object.entries(staff).map(([k, v]) => [k, v ?? ""])),
      } as typeof emptyForm);
    } else {
      setForm({ ...emptyForm, employee_id: generateEmployeeId(), hire_date: new Date().toISOString().slice(0, 10) });
    }
  }, [open, staff]);

  // Load classes and subjects for class-teacher assignment
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const sb: any = supabase;
      const [{ data: cls }, { data: subs }] = await Promise.all([
        sb.from("classes").select("id, name, class_teacher_id").order("name"),
        sb.from("subjects").select("id, name").order("name"),
      ]);
      setClasses(cls || []);
      setSubjects(subs || []);

      if (staff?.id) {
        const assigned = (cls || []).find((c: any) => c.class_teacher_id === staff.id);
        setClassId(assigned?.id || "");
        const { data: links } = await sb
          .from("class_subjects")
          .select("subject_id")
          .eq("teacher_id", staff.id);
        setSubjectIds((links || []).map((l: any) => l.subject_id).filter(Boolean));
      } else {
        setClassId("");
        setSubjectIds([]);
      }
    };
    load();
  }, [open, staff]);

  const toggleSubject = (id: string) =>
    setSubjectIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const saveClassAssignment = async (teacherId: string) => {
    const sb: any = supabase;
    // A teacher owns at most one class: release any previous class
    await sb.from("classes").update({ class_teacher_id: null }).eq("class_teacher_id", teacherId);
    await sb.from("class_subjects").delete().eq("teacher_id", teacherId);
    if (!classId) return;
    await sb.from("classes").update({ class_teacher_id: teacherId }).eq("id", classId);
    if (subjectIds.length) {
      await sb.from("class_subjects").insert(
        subjectIds.map((subject_id) => ({ class_id: classId, subject_id, teacher_id: teacherId })),
      );
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    const payload = {
      employee_id: form.employee_id.trim() || generateEmployeeId(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      department: form.department || null,
      qualification: form.qualification || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      hire_date: form.hire_date || null,
      address: form.address || null,
      bio: form.bio || null,
      status: form.status || "active",
    };

    const { error } = staff
      ? await supabase.from("teachers").update(payload).eq("id", staff.id)
      : await supabase.from("teachers").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(staff ? "Staff member updated" : "Staff member added");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit staff member" : "Add staff member"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employee ID</Label>
            <Input value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>First name *</Label>
            <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Last name *</Label>
            <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Input placeholder="Academics, Admin, Support" value={form.department} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Qualification</Label>
            <Input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={form.gender || undefined} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date of birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Hire date</Label>
            <Input type="date" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {staff ? "Save changes" : "Add staff member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
