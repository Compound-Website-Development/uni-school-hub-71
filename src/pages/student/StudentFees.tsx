import { useMemo } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useStudentBilling } from "@/hooks/useStudentBilling";
import { FeeSchedule } from "@/components/fees/FeeSchedule";
import { naira, balanceOf, invoiceStatusLabel, invoiceStatusTone } from "@/lib/finance";
import { CreditCard, CheckCircle, AlertTriangle, Loader2, Receipt } from "lucide-react";

const StudentFees = () => {
  const { studentData } = useAuth();
  const ids = useMemo(() => (studentData?.id ? [studentData.id] : []), [studentData?.id]);
  const { invoices, lines, receipts, terms, currentTermId, isLoading } = useStudentBilling(ids);

  const current = invoices.find((i: any) => i.term_id === currentTermId) || invoices[0];
  const termName = (id?: string | null) => (terms.find((t: any) => t.id === id) as any)?.name || "Term";
  const totalOwing = invoices.reduce((s: number, i: any) => s + Math.max(balanceOf(i), 0), 0);
  const totalPaid = receipts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const paidPct = current && Number(current.total) > 0
    ? Math.min(100, Math.round((Number(current.amount_paid) / Number(current.total)) * 100))
    : 0;

  if (isLoading) {
    return (
      <StudentLayout title="Fees">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Fee Payments">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees</h1>
          <p className="text-muted-foreground text-sm mt-1">Your term invoice, payments and outstanding balance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl border-border/50 shadow-card card-hover-subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{naira(current?.total)}</p>
                <p className="text-xs text-muted-foreground">{termName(current?.term_id)} total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/50 shadow-card card-hover-subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10 text-success"><CheckCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{naira(totalPaid)}</p>
                <p className="text-xs text-muted-foreground">Total paid</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/50 shadow-card card-hover-subtle">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${totalOwing > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                {totalOwing > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{naira(totalOwing)}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {current && (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold">{current.serial} · {termName(current.term_id)}</CardTitle>
              <Badge variant="outline" className={`${invoiceStatusTone(current.status)} text-[10px]`}>
                {invoiceStatusLabel(current.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Paid {naira(current.amount_paid)}</span>
                  <span>Balance {naira(balanceOf(current))}</span>
                </div>
                <Progress value={paidPct} className="h-2" />
              </div>
              <div className="divide-y divide-border">
                {(lines[current.id] || []).map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-foreground">{l.description}</span>
                    <span className="font-medium">{naira(l.amount)}</span>
                  </div>
                ))}
                {Number(current.discount_total) > 0 && (
                  <div className="flex items-center justify-between py-2.5 text-sm text-success">
                    <span>Discount / scholarship</span>
                    <span className="font-medium">- {naira(current.discount_total)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Payments are recorded by the school bursar. Speak to your parent or guardian about settling any balance.
              </p>
            </CardContent>
          </Card>
        )}

        {receipts.length > 0 && (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" /> Payment history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {receipts.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{naira(r.amount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.method} · {r.serial}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.issued_at || r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <FeeSchedule classId={studentData?.class_id} className={(studentData as any)?.classes?.name} />
      </div>
    </StudentLayout>
  );
};

export default StudentFees;
