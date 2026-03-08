import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminFeesPage = () => {
  const [feeItems, setFeeItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const fetchData = async () => {
    const [{ data: items }, { data: pays }] = await Promise.all([
      supabase.from("fee_items").select("*").order("created_at", { ascending: false }),
      supabase.from("fee_payments").select("*, students(first_name, last_name, student_id), fee_items(name)").order("created_at", { ascending: false }).limit(50),
    ]);
    setFeeItems(items || []);
    setPayments(pays || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddItem = async () => {
    if (!newName.trim() || !newAmount) { toast.error("Name and amount required"); return; }
    const { error } = await supabase.from("fee_items").insert({ name: newName, amount: parseFloat(newAmount) });
    if (!error) {
      toast.success("Fee item added");
      setNewName(""); setNewAmount(""); setDialogOpen(false);
      fetchData();
    } else {
      toast.error("Failed to add fee item");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("fee_items").delete().eq("id", id);
    fetchData();
  };

  const totalRevenue = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  return (
    <AdminLayout title="Fee Management">
      <div className="space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Fee Items</p>
              <p className="text-2xl font-bold text-foreground">{feeItems.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold text-success">₦{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold text-foreground">{payments.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Items */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Fee Items</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fee Item</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label className="text-xs">Fee Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Tuition Fee" /></div>
                  <div><Label className="text-xs">Amount (₦)</Label><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" /></div>
                  <Button onClick={handleAddItem} className="w-full">Add Fee Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Mandatory</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm">₦{Number(item.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{item.is_mandatory ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {feeItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No fee items defined yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Fee Item</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{p.students?.first_name} {p.students?.last_name}</TableCell>
                    <TableCell className="text-xs">{p.fee_items?.name}</TableCell>
                    <TableCell className="text-sm">₦{Number(p.amount_paid).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-[10px] capitalize">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No payments recorded yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeesPage;
