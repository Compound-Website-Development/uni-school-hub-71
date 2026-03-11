import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Loader2 } from "lucide-react";

const ParentFees = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: links } = await supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id);
      if (links && links.length > 0) {
        const ids = links.map((l: any) => l.student_id);
        const [studentsRes, paymentsRes] = await Promise.all([
          supabase.from("students").select("*").in("id", ids),
          supabase.from("fee_payments").select("*, fee_items(name, amount)").in("student_id", ids).order("created_at", { ascending: false }),
        ]);
        setChildren(studentsRes.data || []);
        setPayments(paymentsRes.data || []);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <ParentLayout title="Fees"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></ParentLayout>;
  }

  return (
    <ParentLayout title="Fee Payments">
      <div className="space-y-6 animate-fade-in">
        {children.map((child) => {
          const childPayments = payments.filter((p: any) => p.student_id === child.id);
          return (
            <Card key={child.id} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {child.first_name} {child.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {childPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fee records found.</p>
                ) : (
                  <div className="space-y-2">
                    {childPayments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{p.fee_items?.name || "Fee"}</p>
                          <p className="text-xs text-muted-foreground">₦{Number(p.amount_paid).toLocaleString()}</p>
                        </div>
                        <Badge variant={p.status === "paid" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {children.length === 0 && <Card><CardContent className="p-8 text-center text-muted-foreground">No linked children found.</CardContent></Card>}
      </div>
    </ParentLayout>
  );
};

export default ParentFees;
