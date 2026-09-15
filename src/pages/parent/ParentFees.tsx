import { useState, useEffect, useMemo } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStudentBilling } from "@/hooks/useStudentBilling";
import { InvoiceDocument } from "@/components/fees/InvoiceDocument";
import { ReceiptDocument } from "@/components/fees/ReceiptDocument";
import { FeeSchedule } from "@/components/fees/FeeSchedule";
import { naira, balanceOf, isOverdue, invoiceStatusTone, invoiceStatusLabel } from "@/lib/finance";
import { AlertTriangle, CreditCard, Loader2, Receipt as ReceiptIcon, Wallet, Landmark } from "lucide-react";

const ParentFees = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);
      const ids = (links || []).map((l: any) => l.student_id);
      if (ids.length > 0) {
        const { data } = await supabase.from("students").select("*, classes(name)").in("id", ids);
        setChildren(data || []);
        setActiveChild((data || [])[0]?.id || "");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const childIds = useMemo(() => children.map((c) => c.id), [children]);
  const { invoices, lines, receipts, terms, currentTermId, isLoading: billingLoading } = useStudentBilling(childIds);

  const child = children.find((c) => c.id === activeChild);
  const childInvoices = invoices.filter((i: any) => i.student_id === activeChild);
  const childReceipts = receipts.filter((r: any) => r.student_id === activeChild);
  const currentInvoice = childInvoices.find((i: any) => i.term_id === currentTermId) || childInvoices[0];
  const termName = (id?: string | null) => (terms.find((t: any) => t.id === id) as any)?.name || "Term";
  const overdue = childInvoices.filter((i: any) => isOverdue(i));
  const totalOwing = childInvoices.reduce((s: number, i: any) => s + Math.max(balanceOf(i), 0), 0);

  if (isLoading || billingLoading) {
    return (
      <ParentLayout title="Fees & Payments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ParentLayout>
    );
  }

  if (children.length === 0) {
    return (
      <ParentLayout title="Fees & Payments">
        <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>
      </ParentLayout>
    );
  }

  const paidPct = currentInvoice && Number(currentInvoice.total) > 0
    ? Math.min(100, Math.round((Number(currentInvoice.amount_paid) / Number(currentInvoice.total)) * 100))
    : 0;

  return (
    <ParentLayout title="Fees & Payments">
      <div className="space-y-6 animate-fade-in">
        {/* Child selector */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={c.id === activeChild ? "default" : "outline"}
                className="shrink-0 shadow-sm hover:shadow-md transition-all"
                onClick={() => setActiveChild(c.id)}
              >
                {c.first_name} {c.last_name}
              </Button>
            ))}
          </div>
        )}

        {overdue.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Payment reminder</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {overdue.length === 1 ? "An invoice is" : `${overdue.length} invoices are`} past the due date. Kindly settle
                the outstanding balance of {naira(overdue.reduce((s: number, i: any) => s + balanceOf(i), 0))} at the school office.
              </p>
            </div>
          </div>
        )}

        {/* Money hero */}
        <Card className="border-border/60 overflow-hidden shadow-card">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {child?.first_name} {child?.last_name} · {child?.classes?.name || "Unassigned"} · {termName(currentInvoice?.term_id)}
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">{naira(currentInvoice ? balanceOf(currentInvoice) : 0)}</p>
            <p className="text-xs text-muted-foreground">Balance due this term</p>
            <div className="mt-4 space-y-1.5 max-w-md">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Paid {naira(currentInvoice?.amount_paid)}</span>
                <span>of {naira(currentInvoice?.total)}</span>
              </div>
              <Progress value={paidPct} className="h-2" />
            </div>
          </div>
          <CardContent className="p-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <Wallet className="w-4 h-4 text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{naira(totalOwing)}</p>
              <p className="text-[11px] text-muted-foreground">Total owing (all terms)</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <ReceiptIcon className="w-4 h-4 text-success mb-1" />
              <p className="text-lg font-bold text-foreground">{childReceipts.length}</p>
              <p className="text-[11px] text-muted-foreground">Receipts issued</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <CreditCard className="w-4 h-4 text-info mb-1" />
              <Badge variant="outline" className={`${invoiceStatusTone(currentInvoice?.status)} text-[10px]`}>
                {invoiceStatusLabel(currentInvoice?.status)}
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1">
                {currentInvoice?.due_date ? `Due ${new Date(currentInvoice.due_date).toLocaleDateString()}` : "No due date set"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border/60 bg-card p-4 flex items-start gap-3">
          <Landmark className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">How to pay</p>
            <p className="mt-0.5">
              Fees are paid by bank transfer or at the school office. Present your invoice number when paying, and the bursar
              will issue a receipt that appears here automatically. Online card payment is coming soon.
            </p>
          </div>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="invoices" className="flex-1 sm:flex-none">Invoices</TabsTrigger>
            <TabsTrigger value="receipts" className="flex-1 sm:flex-none">Receipts</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1 sm:flex-none">Fee schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4 mt-4">
            {childInvoices.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
                No invoice has been raised for this pupil yet.
              </CardContent></Card>
            )}
            {childInvoices.map((inv: any) => (
              <Card key={inv.id} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{termName(inv.term_id)} invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvoiceDocument
                    invoice={inv}
                    lines={lines[inv.id] || []}
                    studentName={`${child?.first_name} ${child?.last_name}`}
                    admissionNo={child?.student_id}
                    className={child?.classes?.name}
                    termName={termName(inv.term_id)}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="receipts" className="space-y-3 mt-4">
            {childReceipts.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No receipts yet.</CardContent></Card>
            ) : (
              childReceipts.map((r: any) => (
                <ReceiptDocument
                  key={r.id}
                  receipt={r}
                  compact
                  studentName={`${child?.first_name} ${child?.last_name}`}
                  invoiceSerial={invoices.find((i: any) => i.id === r.invoice_id)?.serial}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <FeeSchedule
              classId={child?.class_id}
              className={child?.classes?.name}
              title={`${child?.first_name}'s term fees`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ParentLayout>
  );
};

export default ParentFees;
