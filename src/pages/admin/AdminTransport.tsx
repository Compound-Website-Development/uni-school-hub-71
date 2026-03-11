import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Plus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminTransport = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", pickup_points: "", driver_name: "", driver_phone: "", vehicle_number: "" });

  const fetchRoutes = async () => {
    const { data } = await supabase.from("transport_routes").select("*").order("name");
    setRoutes(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleAdd = async () => {
    if (!form.name) { toast({ title: "Route name required", variant: "destructive" }); return; }
    const { error } = await supabase.from("transport_routes").insert(form);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Route added" });
    setForm({ name: "", pickup_points: "", driver_name: "", driver_phone: "", vehicle_number: "" }); setDialogOpen(false);
    fetchRoutes();
  };

  const handleDelete = async (id: string) => { await supabase.from("transport_routes").delete().eq("id", id); fetchRoutes(); };

  if (isLoading) {
    return <AdminLayout title="Transport"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Transport Management">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Transport Routes</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Route</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Route</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Route Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Pickup Points (comma-separated)" value={form.pickup_points} onChange={(e) => setForm({ ...form, pickup_points: e.target.value })} />
                <Input placeholder="Driver Name" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
                <Input placeholder="Driver Phone" value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} />
                <Input placeholder="Vehicle Number" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
                <Button onClick={handleAdd} className="w-full">Add Route</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Route</TableHead><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Pickup Points</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No routes configured.</TableCell></TableRow>
                ) : routes.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.driver_name || "—"}</TableCell>
                    <TableCell>{r.vehicle_number || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.pickup_points || "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
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

export default AdminTransport;
