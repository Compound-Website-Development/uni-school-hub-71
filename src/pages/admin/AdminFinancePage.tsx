import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { toast } from "sonner";
import {
  Lock, Loader2, FilePlus2, BadgePercent, BellRing, ScrollText, Wallet, Search,
} from "lucide-react";
import { naira, balanceOf, invoiceStatusLabel, invoiceStatusTone, renderTemplate } from "@/lib/finance";

const AdminFinancePage = () => {
  const { can, isLoading: permsLoading } = useAdminPermissions();
  const canManageFees = can("can_manage_fees");

  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // generate invoices
  const [genTerm, setGenTerm] = useState("");
  const [genClass, setGenClass] = useState("all");
  const [genDue, setGenDue] = useState("");

  // record payment
  const [payInvoice, setPayInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");

  // discount
  const [discStudent, setDiscStudent] = useState("");
  const [discTerm, setDiscTerm] = useState("");
  const [discType, setDiscType] = useState("fixed");
  const [discValue, setDiscValue] = useState("");
  const [discReason, setDiscReason] = useState("");

  // reminder
  const [reminderTarget, setReminderTarget] = useState<any | null>(null);
  const [reminderTemplate, setReminderTemplate] = useState("");

  const load = async () => {
    const [invRes, stuRes, clsRes, termRes, discRes, auditRes, tplRes] = await Promise.all([
      supabase.from("invoices").select("*, students(first_name, last_name, student_id), classes(name)").order("created_at", { ascending: false }).limit(500),
      supabase.from("students").select("id, first_name, last_name, student_id, class_id").order("first_name"),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("terms").select("id, name, session, is_current").order("term_number"),
      supabase.from("student_discounts").select("*, students(first_name, last_name, student_id)").order("created_at", { ascending: false }).limit(100),
      supabase.from("finance_audit").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("message_templates").select("*").eq("is_active", true).order("name"),
    ]);
    setInvoices(invRes.data || []);
    setStudents(stuRes.data || []);
    setClasses(clsRes.data || []);
    setTerms(termRes.data || []);
    setDiscounts(discRes.data || []);
    setAudit(auditRes.data || []);
    setTemplates(tplRes.data || []);
    const current = (termRes.data || []).find((t: any) => t.is_current);
    if (current) { setGenTerm((prev) => prev || current.id); setDiscTerm((prev) => prev || current.id); }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const debtors = useMemo(
    () => invoices.filter((i) => balanceOf(i) > 0).sort((a, b) => balanceOf(b) - balanceOf(a)),
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      `${i.students?.first_name} ${i.students?.last_name} ${i.students?.student_id} ${i.serial}`.toLowerCase().includes(q));
  }, [invoices, search]);

  const totals = useMemo(() => {
    const billed = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const collected = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    return { billed, collected, outstanding: billed - collected };
  }, [invoices]);

  const termName = (id?: string | null) => terms.find((t) => t.id === id)?.name || "—";

  const handleGenerate = async () => {
    if (!genTerm) { toast.error("Choose a term"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_term_invoices", {
      _term_id: genTerm,
      _class_id: genClass === "all" ? null : genClass,
      _due_date: genDue || null,
    } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${data ?? 0} new invoice(s) created, existing invoices refreshed`);
    load();
  };

  const handleRecordPayment = async () => {
    if (!payInvoice || !payAmount) { toast.error("Enter an amount"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("record_manual_payment", {
      _invoice_id: payInvoice.id,
      _amount: Number(payAmount),
      _method: payMethod,
      _reference: payRef || null,
      _note: payNote || null,
    } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment recorded and receipt issued");
    setPayInvoice(null); setPayAmount(""); setPayRef(""); setPayNote("");
    load();
  };

  const handleDiscount = async () => {
    if (!discStudent || !discValue) { toast.error("Choose a pupil and a value"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("upsert_student_discount", {
      _student_id: discStudent,
      _term_id: discTerm || null,
      _discount_type: discType,
      _value: Number(discValue),
      _reason: discReason || null,
    } as any);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Discount applied to the pupil's invoice");
    setDiscValue(""); setDiscReason("");
    load();
  };

  const handleSendReminder = async () => {
    const invoice = reminderTarget;
    const tpl = templates.find((t) => t.id === reminderTemplate);
    if (!invoice || !tpl) { toast.error("Choose a template"); return; }

    const message = renderTemplate(tpl.body, {
      parent_name: "Parent/Guardian",
      student_name: `${invoice.students?.first_name} ${invoice.students?.last_name}`,
      class_name: invoice.classes?.name || "",
      term: termName(invoice.term_id),
      balance: naira(balanceOf(invoice)),
      due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "the stated date",
    });

    setBusy(true);
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("parent_user_id")
      .eq("student_id", invoice.student_id);

    const rows = (links || []).map((l: any) => ({
      user_id: l.parent_user_id,
      title: "Fee reminder",
      body: message.replace(/<[^>]+>/g, " "),
      type: "finance",
      link: "/parent/fees",
    }));
    if (rows.length > 0) await supabase.from("notifications").insert(rows);
    await supabase.from("finance_audit").insert({
      action: "send_reminder",
      entity: "invoices",
      entity_id: invoice.id,
      after_data: { template: tpl.key, channel: tpl.channel, recipients: rows.length } as any,
    });
    setBusy(false);
    setReminderTarget(null);
    toast.success(rows.length > 0 ? `Reminder sent to ${rows.length} guardian(s)` : "No guardian is linked to this pupil yet");
    load();
  };

  if (!permsLoading && !canManageFees) {
    return (
      <AdminLayout title="Finance">
        <Card className="border-border/50">
          <CardContent className="p-10 text-center space-y-2">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Bursar access required</p>
            <p className="text-sm text-muted-foreground">Invoices, discounts and receipts are limited to administrators with the “Manage fees” permission.</p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout title="Finance">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Finance">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Invoices raised", value: invoices.length.toString(), tone: "text-foreground" },
            { label: "Total billed", value: naira(totals.billed), tone: "text-foreground" },
            { label: "Collected", value: naira(totals.collected), tone: "text-success" },
            { label: "Outstanding", value: naira(totals.outstanding), tone: "text-destructive" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50 shadow-card card-hover-subtle">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.tone}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="invoices">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="debtors">Debtors</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="audit">Audit trail</TabsTrigger>
          </TabsList>

          {/* INVOICES */}
          <TabsContent value="invoices" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FilePlus2 className="w-4 h-4 text-primary" /> Generate term invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">Term</Label>
                  <Select value={genTerm} onValueChange={setGenTerm}>
                    <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} {t.session ? `(${t.session})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Class</Label>
                  <Select value={genClass} onValueChange={setGenClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Whole school</SelectItem>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Due date</Label>
                  <Input type="date" value={genDue} onChange={(e) => setGenDue(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleGenerate} disabled={busy} className="w-full shadow-md hover:shadow-lg transition-shadow">
                    {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FilePlus2 className="w-4 h-4 mr-1.5" />}
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-sm font-semibold">All invoices</CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8 h-9" placeholder="Search pupil or serial" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Serial</TableHead>
                      <TableHead className="text-xs">Pupil</TableHead>
                      <TableHead className="text-xs">Class</TableHead>
                      <TableHead className="text-xs">Term</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs text-right">Paid</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.slice(0, 120).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs font-mono">{i.serial}</TableCell>
                        <TableCell className="text-sm">{i.students?.first_name} {i.students?.last_name}</TableCell>
                        <TableCell className="text-xs">{i.classes?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{termName(i.term_id)}</TableCell>
                        <TableCell className="text-sm text-right">{naira(i.total)}</TableCell>
                        <TableCell className="text-sm text-right">{naira(i.amount_paid)}</TableCell>
                        <TableCell className={`text-sm text-right font-semibold ${balanceOf(i) > 0 ? "text-destructive" : "text-success"}`}>{naira(balanceOf(i))}</TableCell>
                        <TableCell><Badge variant="outline" className={`${invoiceStatusTone(i.status)} text-[10px]`}>{invoiceStatusLabel(i.status)}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setPayInvoice(i); setPayAmount(String(Math.max(balanceOf(i), 0))); }}>
                            <Wallet className="w-3.5 h-3.5 mr-1" /> Record payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-sm text-muted-foreground">No invoices yet — generate them above.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEBTORS */}
          <TabsContent value="debtors" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Outstanding balances ({debtors.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Pupil</TableHead>
                      <TableHead className="text-xs">Class</TableHead>
                      <TableHead className="text-xs">Term</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs">Due</TableHead>
                      <TableHead className="text-xs" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtors.slice(0, 120).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-sm">{i.students?.first_name} {i.students?.last_name}
                          <span className="block text-[10px] text-muted-foreground font-mono">{i.students?.student_id}</span>
                        </TableCell>
                        <TableCell className="text-xs">{i.classes?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{termName(i.term_id)}</TableCell>
                        <TableCell className="text-sm text-right font-semibold text-destructive">{naira(balanceOf(i))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setReminderTarget(i); setReminderTemplate(templates.find((t) => t.key === "fee_reminder")?.id || ""); }}>
                            <BellRing className="w-3.5 h-3.5 mr-1" /> Send reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {debtors.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No outstanding balances.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISCOUNTS */}
          <TabsContent value="discounts" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BadgePercent className="w-4 h-4 text-accent" /> Grant a discount or scholarship
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Pupil</Label>
                  <Select value={discStudent} onValueChange={setDiscStudent}>
                    <SelectTrigger><SelectValue placeholder="Select pupil" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.student_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Term</Label>
                  <Select value={discTerm} onValueChange={setDiscTerm}>
                    <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={discType} onValueChange={setDiscType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed amount (₦)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input type="number" value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder="0" />
                </div>
                <div className="sm:col-span-4">
                  <Label className="text-xs">Reason</Label>
                  <Input value={discReason} onChange={(e) => setDiscReason(e.target.value)} placeholder="e.g. Staff child, sibling discount, bursary" />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDiscount} disabled={busy} className="w-full shadow-md hover:shadow-lg transition-shadow">Apply</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recent discounts</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Pupil</TableHead>
                      <TableHead className="text-xs">Term</TableHead>
                      <TableHead className="text-xs">Discount</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Granted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm">{d.students?.first_name} {d.students?.last_name}</TableCell>
                        <TableCell className="text-xs">{termName(d.term_id)}</TableCell>
                        <TableCell className="text-sm">{d.discount_type === "percentage" ? `${d.value}%` : naira(d.value)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.reason || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {discounts.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No discounts granted yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary" /> Finance audit trail
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">When</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Entity</TableHead>
                      <TableHead className="text-xs">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] capitalize">{String(a.action).replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="text-xs">{a.entity}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground max-w-md truncate">{JSON.stringify(a.after_data)}</TableCell>
                      </TableRow>
                    ))}
                    {audit.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">No finance activity recorded yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Record payment dialog */}
      <Dialog open={Boolean(payInvoice)} onOpenChange={(o) => !o && setPayInvoice(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          {payInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                <p className="font-semibold text-foreground text-sm">{payInvoice.students?.first_name} {payInvoice.students?.last_name}</p>
                <p className="text-muted-foreground">{payInvoice.serial} · balance {naira(balanceOf(payInvoice))}</p>
              </div>
              <div><Label className="text-xs">Amount (₦)</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Bank transfer</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Reference</Label><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Teller / transfer reference" /></div>
              <div><Label className="text-xs">Note</Label><Textarea rows={2} value={payNote} onChange={(e) => setPayNote(e.target.value)} /></div>
              <Button className="w-full shadow-md" onClick={handleRecordPayment} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null} Record payment & issue receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder dialog */}
      <Dialog open={Boolean(reminderTarget)} onOpenChange={(o) => !o && setReminderTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send fee reminder</DialogTitle></DialogHeader>
          {reminderTarget && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Template</Label>
                <Select value={reminderTemplate} onValueChange={setReminderTemplate}>
                  <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {(() => {
                  const tpl = templates.find((t) => t.id === reminderTemplate);
                  if (!tpl) return "Select a template to preview the message.";
                  return renderTemplate(tpl.body, {
                    parent_name: "Parent/Guardian",
                    student_name: `${reminderTarget.students?.first_name} ${reminderTarget.students?.last_name}`,
                    class_name: reminderTarget.classes?.name || "",
                    term: termName(reminderTarget.term_id),
                    balance: naira(balanceOf(reminderTarget)),
                    due_date: reminderTarget.due_date ? new Date(reminderTarget.due_date).toLocaleDateString() : "the stated date",
                  }).replace(/<[^>]+>/g, " ");
                })()}
              </div>
              <Button className="w-full shadow-md" onClick={handleSendReminder} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <BellRing className="w-4 h-4 mr-1.5" />} Send to guardians
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFinancePage;
