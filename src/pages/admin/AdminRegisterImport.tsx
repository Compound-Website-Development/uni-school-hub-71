import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookUser, Loader2, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { CLASS_STRUCTURE } from "@/lib/schoolConfig";
import type { ClassOption } from "@/components/admin/StudentFormDialog";

const UNASSIGNED = "__unassigned__";

interface Row {
  key: string;
  admission_no: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  guardian_name: string;
  guardian_phone: string;
  address: string;
  class_id: string;
}

const newRow = (): Row => ({
  key: crypto.randomUUID(),
  admission_no: "",
  full_name: "",
  gender: "",
  date_of_birth: "",
  guardian_name: "",
  guardian_phone: "",
  address: "",
  class_id: UNASSIGNED,
});

/** Normalise the many date shapes found in the handwritten register. */
const normaliseDate = (raw: string): string => {
  const v = raw.trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const splitName = (full: string) => {
  const parts = full.trim().replace(/\s+/g, " ").split(" ");
  if (parts.length === 1) return { first: parts[0], middle: "", last: "" };
  return { first: parts[0], last: parts[parts.length - 1], middle: parts.slice(1, -1).join(" ") };
};

/** Splits a pasted line on tabs, commas or 2+ spaces. */
const splitLine = (line: string) =>
  line.includes("\t") ? line.split("\t") : line.includes(",") ? line.split(",") : line.split(/\s{2,}/);

const AdminRegisterImport = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [paste, setPaste] = useState("");
  const [defaultClass, setDefaultClass] = useState(UNASSIGNED);
  const [prefix, setPrefix] = useState(`IMS/${new Date().getFullYear()}/`);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadClasses = async () => {
    const { data } = await supabase.from("classes").select("id, name, level, arm").order("name");
    setClasses(data || []);
  };

  useEffect(() => { loadClasses(); }, []);

  const readyCount = useMemo(() => rows.filter((r) => r.full_name.trim()).length, [rows]);

  const seedClasses = async () => {
    setSeeding(true);
    const existing = new Set(classes.map((c) => c.name.toLowerCase()));
    const toCreate = CLASS_STRUCTURE.flatMap((c) =>
      c.arms.map((arm) => ({ name: `${c.level} (${arm})`, level: c.level, arm }))
    ).filter((c) => !existing.has(c.name.toLowerCase()));

    if (toCreate.length === 0) {
      setSeeding(false);
      toast.info("All school classes already exist");
      return;
    }
    const { error } = await supabase.from("classes").insert(toCreate);
    setSeeding(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`${toCreate.length} classes created`);
      loadClasses();
    }
  };

  const parsePaste = () => {
    const lines = paste.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) {
      toast.error("Nothing to parse — paste some register rows first");
      return;
    }
    const parsed: Row[] = lines
      .filter((l) => !/^(s\/?n|admission|no\.?|name)\b/i.test(l.split(/[\t,]/)[0].trim()))
      .map((line) => {
        const cells = splitLine(line).map((c) => c.trim());
        const [admission = "", name = "", dob = "", gender = "", guardian = "", phone = "", address = ""] = cells;
        // If the first cell looks like a name rather than an admission number, shift it.
        const looksLikeNo = /\d/.test(admission) && admission.length <= 14;
        return {
          ...newRow(),
          admission_no: looksLikeNo ? admission : "",
          full_name: looksLikeNo ? name : admission,
          date_of_birth: normaliseDate(looksLikeNo ? dob : name),
          gender: (looksLikeNo ? gender : dob).toLowerCase().startsWith("f") ? "female" : (looksLikeNo ? gender : dob).toLowerCase().startsWith("m") ? "male" : "",
          guardian_name: looksLikeNo ? guardian : gender,
          guardian_phone: looksLikeNo ? phone : guardian,
          address: looksLikeNo ? address : phone,
          class_id: defaultClass,
        };
      })
      .filter((r) => r.full_name);

    if (!parsed.length) {
      toast.error("Could not read any names from that text");
      return;
    }
    setRows(parsed);
    toast.success(`${parsed.length} rows ready for review`);
  };

  const update = (key: string, field: keyof Row, value: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const applyClassToAll = (classId: string) => {
    setDefaultClass(classId);
    setRows((rs) => rs.map((r) => ({ ...r, class_id: classId })));
  };

  const importAll = async () => {
    const valid = rows.filter((r) => r.full_name.trim());
    if (!valid.length) {
      toast.error("Add at least one student name");
      return;
    }
    setSaving(true);
    const payload = valid.map((r, i) => {
      const { first, middle, last } = splitName(r.full_name);
      return {
        student_id: r.admission_no.trim() || `${prefix}${String(i + 1).padStart(4, "0")}`,
        first_name: first,
        middle_name: middle || null,
        last_name: last || first,
        gender: r.gender || null,
        date_of_birth: r.date_of_birth || null,
        guardian_name: r.guardian_name || null,
        guardian_phone: r.guardian_phone || null,
        address: r.address || null,
        class_id: r.class_id === UNASSIGNED ? null : r.class_id,
        status: "active",
        admission_date: new Date().toISOString().slice(0, 10),
      };
    });

    const { error } = await supabase.from("students").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${payload.length} students imported`);
    setRows([newRow()]);
    setPaste("");
  };

  return (
    <AdminLayout title="Admission Register Import">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><BookUser className="w-6 h-6 text-primary" /> Digitise the admission register</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Type or paste rows from the handwritten register (admission no, name, date of birth, gender, parent, phone, address),
            review them in the grid, set a temporary class for each child, then import.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Paste register rows</CardTitle>
            <CardDescription>One student per line. Separate columns with tabs, commas or two spaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              className="font-mono text-xs"
              placeholder={"001, Adeyemi Tolulope Grace, 12/05/2019, F, Mrs Adeyemi Bisi, 08012345678, 12 Nathan Street Surulere"}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={parsePaste} className="gap-1.5"><Wand2 className="w-4 h-4" /> Parse rows</Button>
              <Button variant="outline" onClick={() => setRows((r) => [...r, newRow()])} className="gap-1.5"><Plus className="w-4 h-4" /> Add blank row</Button>
              <Button variant="outline" onClick={seedClasses} disabled={seeding} className="gap-1.5">
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create school classes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Review and assign classes</CardTitle>
            <CardDescription>Everything here is editable before anything is saved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Temporary class for all rows</Label>
                <Select value={defaultClass} onValueChange={applyClassToAll}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Admission number prefix (for blanks)</Label>
                <Input className="h-9 text-sm" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="h-9 px-3 flex items-center">{readyCount} students ready</Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs min-w-32">Admission No.</TableHead>
                    <TableHead className="text-xs min-w-56">Full name</TableHead>
                    <TableHead className="text-xs min-w-36">Date of birth</TableHead>
                    <TableHead className="text-xs min-w-28">Gender</TableHead>
                    <TableHead className="text-xs min-w-44">Parent / guardian</TableHead>
                    <TableHead className="text-xs min-w-36">Phone</TableHead>
                    <TableHead className="text-xs min-w-56">Address</TableHead>
                    <TableHead className="text-xs min-w-48">Class</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell><Input className="h-8 text-xs" value={r.admission_no} onChange={(e) => update(r.key, "admission_no", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.full_name} onChange={(e) => update(r.key, "full_name", e.target.value)} /></TableCell>
                      <TableCell><Input type="date" className="h-8 text-xs" value={r.date_of_birth} onChange={(e) => update(r.key, "date_of_birth", e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={r.gender || undefined} onValueChange={(v) => update(r.key, "gender", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.guardian_name} onChange={(e) => update(r.key, "guardian_name", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.guardian_phone} onChange={(e) => update(r.key, "guardian_phone", e.target.value)} /></TableCell>
                      <TableCell><Input className="h-8 text-xs" value={r.address} onChange={(e) => update(r.key, "address", e.target.value)} /></TableCell>
                      <TableCell>
                        <Select value={r.class_id} onValueChange={(v) => update(r.key, "class_id", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button onClick={importAll} disabled={saving || readyCount === 0} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Import {readyCount} students
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminRegisterImport;
