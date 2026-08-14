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
