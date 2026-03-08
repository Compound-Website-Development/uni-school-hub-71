import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const StudentFees = () => {
  const { studentData } = useAuth();
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFees = async () => {
      if (!studentData?.id) return;
      const [{ data: items }, { data: pays }] = await Promise.all([
        supabase.from("fee_items").select("*"),
        supabase.from("fee_payments").select("*").eq("student_id", studentData.id),
      ]);
      setFeeItems(items || []);
      setPayments(pays || []);
      setIsLoading(false);
    };
    fetchFees();
  }, [studentData]);

  const getPaymentForItem = (itemId: string) => payments.find(p => p.fee_item_id === itemId);

  const totalFees = feeItems.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const outstanding = totalFees - totalPaid;

  return (
    <StudentLayout title="Fee Payments">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">View your fee breakdown and payment status</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><CreditCard className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">₦{totalFees.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Fees</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10 text-success"><CheckCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">₦{totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${outstanding > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                {outstanding > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₦{outstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Items Table */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Fee Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feeItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No fee items found for the current term.</p>
            ) : (
              <div className="divide-y divide-border">
                {feeItems.map((item) => {
                  const payment = getPaymentForItem(item.id);
                  const isPaid = payment && payment.status === "paid";
                  return (
                    <div key={item.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-foreground text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.is_mandatory ? "Mandatory" : "Optional"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-foreground">₦{(item.amount || 0).toLocaleString()}</p>
                        <Badge className={isPaid ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                          {isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {payments.length > 0 && (
          <Card className="rounded-xl border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">₦{(p.amount_paid || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method || "N/A"} • {p.reference || "No ref"}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={p.status === "paid" ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                        {p.status}
                      </Badge>
                      {p.paid_at && <p className="text-xs text-muted-foreground mt-1">{new Date(p.paid_at).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentFees;
