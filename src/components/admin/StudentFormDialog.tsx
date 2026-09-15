import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, User, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { generateParentCode, generateParentId, suggestClassId, uploadStudentPhoto, suggestLevelForDob } from "@/lib/studentUtils";
import StudentPhoto from "@/components/StudentPhoto";

export interface ClassOption {
  id: string;
  name: string;
  level?: string | null;
  arm?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student?: any | null;
  classes: ClassOption[];
  onSaved: () => void;
}

const UNASSIGNED = "__unassigned__";

const emptyForm = {
  student_id: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  gender: "",
  date_of_birth: "",
  class_id: UNASSIGNED,
  status: "active",
  email: "",
  phone: "",
  address: "",
  guardian_name: "",
  guardian_relation: "",
  guardian_phone: "",
  guardian_email: "",
  admission_date: "",
  section: "",
  parent_phone: "",
  photo_url: "",
  parent_id: "",
  parent_code: "",
};

export const generateStudentId = () =>
  `IMS/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

export const StudentFormDialog = ({ open, onOpenChange, student, classes, onSaved }: Props) => {
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    if (student) {
      setForm({
        ...emptyForm,
        ...Object.fromEntries(Object.entries(student).map(([k, v]) => [k, v ?? ""])),
        class_id: student.class_id || UNASSIGNED,
      } as typeof emptyForm);
      setVerified(!!student.is_verified);
    } else {
      setForm({
        ...emptyForm,
        student_id: generateStudentId(),
        admission_date: new Date().toISOString().slice(0, 10),
        parent_id: generateParentId(),
        parent_code: generateParentCode(),
      });
      setVerified(false);
    }
    setPhotoFile(null);
  }, [open, student]);

  const suggestedLevel = suggestLevelForDob(form.date_of_birth);

  const applySuggestion = () => {
    const id = suggestClassId(form.date_of_birth, classes);
    if (id) {
      set("class_id", id);
      toast.success(`Temporary placement: ${classes.find((c) => c.id === id)?.name}`);
    } else {
      toast.error("Add a date of birth first, or no matching class arm exists.");
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
      student_id: form.student_id.trim() || generateStudentId(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      middle_name: form.middle_name || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      class_id: form.class_id === UNASSIGNED ? null : form.class_id,
      status: form.status || "active",
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      guardian_name: form.guardian_name || null,
      guardian_relation: form.guardian_relation || null,
      guardian_phone: form.guardian_phone || null,
      guardian_email: form.guardian_email || null,
      admission_date: form.admission_date || null,
      section: form.section || null,
      parent_phone: form.parent_phone || null,
      photo_url: form.photo_url || null,
      is_verified: verified,
      parent_id: (form.parent_id || generateParentId()).toUpperCase(),
      parent_code: (form.parent_code || generateParentCode()).toUpperCase(),
    };

    let error: { message: string } | null = null;
    let savedId: string | null = student?.id ?? null;

    if (student) {
      const res = await supabase.from("students").update(payload).eq("id", student.id);
      error = res.error;
    } else {
      const res = await supabase.from("students").insert(payload).select("id").single();
      error = res.error;
      savedId = res.data?.id ?? null;
    }

    if (!error && photoFile && savedId) {
      const url = await uploadStudentPhoto(savedId, photoFile);
      if (url) await supabase.from("students").update({ photo_url: url }).eq("id", savedId);
      else toast.error("Student saved, but the photo could not be uploaded.");
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(student ? "Student updated" : "Student added");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Admission / Student No.</Label>
            <Input value={form.student_id} onChange={(e) => set("student_id", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={form.class_id} onValueChange={(v) => set("class_id", v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suggestedLevel && (
              <button type="button" onClick={applySuggestion} className="text-xs text-primary hover:underline">
                Suggested from age: {suggestedLevel} — apply
              </button>
            )}
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
            <Label>Middle name</Label>
            <Input value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} />
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
            <Label>Admission date</Label>
            <Input type="date" value={form.admission_date} onChange={(e) => set("admission_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Student email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Home address</Label>
            <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parent / guardian name</Label>
            <Input value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <Input placeholder="Mother, Father, Guardian" value={form.guardian_relation} onChange={(e) => set("guardian_relation", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parent phone</Label>
            <Input value={form.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parent email</Label>
            <Input type="email" value={form.guardian_email} onChange={(e) => set("guardian_email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Parent phone (second contact)</Label>
            <Input value={form.parent_phone} onChange={(e) => set("parent_phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Section / arm</Label>
            <Input placeholder="Faith, Joy, Diamond..." value={form.section} onChange={(e) => set("section", e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Passport photograph</Label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-md bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {photoFile ? (
                  <img src={URL.createObjectURL(photoFile)} alt="Selected passport" className="w-full h-full object-cover" />
                ) : form.photo_url ? (
                  <StudentPhoto photoRef={form.photo_url} alt="Student passport" fallback={<User className="w-6 h-6 text-muted-foreground/40" />} />
                ) : (
                  <User className="w-6 h-6 text-muted-foreground/40" />
                )}
              </div>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50">
                <Upload className="w-4 h-4" /> Choose photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Parent ID (for parent dashboard)</Label>
            <Input className="font-mono" value={form.parent_id} onChange={(e) => set("parent_id", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1.5">
            <Label>Parent access code</Label>
            <div className="flex gap-2">
              <Input className="font-mono" value={form.parent_code} onChange={(e) => set("parent_code", e.target.value.toUpperCase())} />
              <Button type="button" variant="outline" size="icon" onClick={() => set("parent_code", generateParentCode())} title="Regenerate code">
                <Wand2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Verified by the school</p>
              <p className="text-xs text-muted-foreground">ID cards can only be printed for verified records.</p>
            </div>
            <Switch checked={verified} onCheckedChange={setVerified} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {student ? "Save changes" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
