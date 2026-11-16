import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Plus, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminVisitors = () => {
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", purpose: "", person_to_meet: "" });

  const fetchVisitors = async () => {
    const { data } = await supabase.from("visitor_log").select("*").order("check_in", { ascending: false }).limit(100);
    setVisitors(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleCheckIn = async () => {
    if (!form.name || !form.purpose) { toast({ title: "Name and purpose required", variant: "destructive" }); return; }
    const { error } = await supabase.from("visitor_log").insert(form);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Visitor checked in" });
    setForm({ name: "", phone: "", purpose: "", person_to_meet: "" }); setDialogOpen(false);
    fetchVisitors();
  };

  const handleCheckOut = async (id: string) => {
    await supabase.from("visitor_log").update({ check_out: new Date().toISOString() }).eq("id", id);
    fetchVisitors();
  };

  if (isLoading) {
    return <AdminLayout title="Visitors"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Visitor Management">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Visitor Log</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Check In Visitor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Check In Visitor</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Visitor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Purpose of Visit" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                <Input placeholder="Person to Meet" value={form.person_to_meet} onChange={(e) => setForm({ ...form, person_to_meet: e.target.value })} />
                <Button onClick={handleCheckIn} className="w-full">Check In</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Purpose</TableHead><TableHead>Meeting</TableHead><TableHead>Check In</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {visitors.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No visitors logged.</TableCell></TableRow>
                ) : visitors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.purpose}</TableCell>
                    <TableCell>{v.person_to_meet || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(v.check_in).toLocaleString()}</TableCell>
                    <TableCell>
                      {v.check_out ? <Badge variant="default">Checked Out</Badge> : <Badge variant="secondary">In Premises</Badge>}
                    </TableCell>
                    <TableCell>
                      {!v.check_out && <Button variant="ghost" size="sm" onClick={() => handleCheckOut(v.id)}><LogOut className="w-4 h-4" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminVisitors;
