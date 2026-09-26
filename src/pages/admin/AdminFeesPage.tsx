import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Plus, Pencil, Trash2, Lock, UsersRound } from "lucide-react";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";

const categories = [
  { value: "general", label: "General" },
  { value: "tuition", label: "Tuition" },
  { value: "uniform", label: "Uniform" },
  { value: "club", label: "Club" },
  { value: "textbook", label: "Textbook" },
];

const AdminFeesPage = () => {
  const { can, isLoading: permsLoading } = useAdminPermissions();
  const canManageFees = can("can_manage_fees");
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [mandatory, setMandatory] = useState(true);
  const [active, setActive] = useState(true);
  const [clubStudent, setClubStudent] = useState("");
  const [clubTerm, setClubTerm] = useState("");
  const [clubFee, setClubFee] = useState("");

  const clubItems = useMemo(() => feeItems.filter((f) => f.category === "club" && f.is_active), [feeItems]);

  const fetchData = async () => {
    const [{ data: items }, { data: pays }, { data: stu }, { data: trms }, { data: sels }] = await Promise.all([
      supabase.from("fee_items").select("*").order("category").order("name"),
      supabase.from("receipts").select("*, students(first_name, last_name, student_id), invoices(serial)").order("created_at", { ascending: false }).limit(50),
      supabase.from("students").select("id, first_name, last_name, student_id").eq("status", "active").order("first_name"),
      supabase.from("terms").select("id, name, is_current").order("term_number"),
      supabase.from("student_fee_selections").select("*, students(first_name, last_name, student_id), fee_items(name, category), terms(name)").order("selected_at", { ascending: false }).limit(300),
    ]);
    setFeeItems(items || []);
    setPayments(pays || []);
    setStudents(stu || []);
    setTerms(trms || []);
    setSelections(sels || []);
    const current = (trms || []).find((t: any) => t.is_current);
    if (current) setClubTerm((prev) => prev || current.id);
    const defaultClub = (items || []).find((f: any) => f.category === "club" && f.is_active);
    if (defaultClub) setClubFee((prev) => prev || defaultClub.id);
  };

  useEffect(() => { void fetchData(); }, []);

  const openAdd = () => {
    setEditing(null); setName(""); setAmount(""); setCategory("general"); setMandatory(true); setActive(true); setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item); setName(item.name); setAmount(String(item.amount)); setCategory(item.category || "general");
    setMandatory(Boolean(item.is_mandatory)); setActive(Boolean(item.is_active)); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || amount === "" || Number(amount) < 0) { toast.error("Enter a fee name and valid amount"); return; }
    const payload = { name: name.trim(), amount: Number(amount), category, is_mandatory: mandatory, is_active: active };
    const result = editing
      ? await supabase.from("fee_items").update(payload).eq("id", editing.id)
      : await supabase.from("fee_items").insert(payload);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(editing ? "Fee updated" : "Fee added");
    setDialogOpen(false); await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this fee item? Existing invoice lines remain, but future invoices will not use it.")) return;
    const { error } = await supabase.from("fee_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Fee item deleted"); fetchData();
  };

  const assignClub = async () => {
    if (!clubStudent || !clubTerm || !clubFee) { toast.error("Choose a pupil, term and club"); return; }
    const { error: delError } = await supabase.from("student_fee_selections").delete()
      .eq("student_id", clubStudent).eq("term_id", clubTerm).in("fee_item_id", clubItems.map((f) => f.id));
    if (delError) { toast.error(delError.message); return; }
    const { error } = await supabase.from("student_fee_selections").insert({ student_id: clubStudent, term_id: clubTerm, fee_item_id: clubFee });
    if (error) { toast.error(error.message); return; }
    toast.success("Club selection saved"); fetchData();
  };

  const removeClub = async (studentId: string, termId: string) => {
    const { error } = await supabase.from("student_fee_selections").delete()
      .eq("student_id", studentId).eq("term_id", termId).in("fee_item_id", clubItems.map((f) => f.id));
    if (error) { toast.error(error.message); return; }
    toast.success("Club selection removed"); fetchData();
  };

  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  if (!permsLoading && !canManageFees) return (
    <AdminLayout title="Fee Setup"><Card><CardContent className="p-10 text-center space-y-2">
      <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
      <p className="font-semibold">Bursar access required</p>
      <p className="text-sm text-muted-foreground">Fee setup is limited to administrators with the “Manage fees” permission.</p>
    </CardContent></Card></AdminLayout>
  );

  return (
    <AdminLayout title="Fee Setup">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Fee items</p><p className="text-2xl font-bold">{feeItems.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active fees</p><p className="text-2xl font-bold">{feeItems.filter((f) => f.is_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Recorded receipts</p><p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div><CardTitle className="text-sm font-semibold">Fee catalogue</CardTitle><p className="text-xs text-muted-foreground mt-1">Names, amounts, categories and billing status can all be changed here.</p></div>
            <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add fee</Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Billing</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {feeItems.map((item) => <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{item.category || "general"}</Badge></TableCell>
                <TableCell>₦{Number(item.amount).toLocaleString()}</TableCell>
                <TableCell><Badge variant={item.is_mandatory ? "default" : "secondary"}>{item.is_mandatory ? "Mandatory" : "Optional"}</Badge></TableCell>
                <TableCell><Badge variant="outline">{item.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </TableCell>
              </TableRow>)}
              {!feeItems.length && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground"><CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />No fee items defined yet.</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><UsersRound className="w-4 h-4" /> Optional club assignment</CardTitle><p className="text-xs text-muted-foreground">Each child can have one club selected for a term. Optional clubs are only added to that child's invoice when selected.</p></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2"><Label className="text-xs">Pupil</Label><Select value={clubStudent} onValueChange={setClubStudent}><SelectTrigger><SelectValue placeholder="Choose pupil" /></SelectTrigger><SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.student_id}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Term</Label><Select value={clubTerm} onValueChange={setClubTerm}><SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger><SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Club</Label><Select value={clubFee} onValueChange={setClubFee}><SelectTrigger><SelectValue placeholder="Club" /></SelectTrigger><SelectContent>{clubItems.map((f) => <SelectItem key={f.id} value={f.id}>{f.name} · ₦{Number(f.amount).toLocaleString()}</SelectItem>)}</SelectContent></Select></div>
            <div className="sm:col-span-4"><Button onClick={assignClub}>Save club selection</Button></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Current club selections</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Pupil</TableHead><TableHead>Club</TableHead><TableHead>Term</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {selections.map((s) => <TableRow key={s.id}><TableCell>{s.students?.first_name} {s.students?.last_name}<span className="block text-[10px] text-muted-foreground">{s.students?.student_id}</span></TableCell><TableCell>{s.fee_items?.name}</TableCell><TableCell>{s.terms?.name || "All terms"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeClub(s.student_id, s.term_id)}>Remove</Button></TableCell></TableRow>)}
              {!selections.length && <TableRow><TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">No optional club selections yet.</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50"><CardContent className="p-4 text-xs text-amber-900">
          <strong>Textbook fee:</strong> created at ₦0 and editable. Since current textbook sales have concluded, it will not add a charge until an authorised admin activates/edits it.
        </CardContent></Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit fee item" : "Add fee item"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label className="text-xs">Fee name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className="text-xs">Amount (₦)</Label><Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label className="text-xs">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /> Mandatory — include automatically on term invoices</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active — available for billing/selection</label>
          <Button className="w-full" onClick={handleSave}>{editing ? "Save changes" : "Create fee"}</Button>
        </div>
      </DialogContent></Dialog>
    </AdminLayout>
  );
};

export default AdminFeesPage;
