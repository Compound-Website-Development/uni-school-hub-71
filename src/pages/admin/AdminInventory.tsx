import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Package, Plus, Search, Box, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

const AdminInventory = () => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", category: "general", quantity: "1", location: "", condition: "good",
    serial_number: "", purchase_date: "", purchase_cost: "0", notes: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await supabase.from("inventory_items").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const qty = parseInt(form.quantity) || 1;
    const { error } = await supabase.from("inventory_items").insert({
      name: form.name, category: form.category, quantity: qty, available: qty,
      location: form.location || null, condition: form.condition,
      serial_number: form.serial_number || null, purchase_date: form.purchase_date || null,
      purchase_cost: parseFloat(form.purchase_cost) || 0, notes: form.notes || null,
    });
    if (error) { toast.error("Failed to add item"); return; }
    toast.success("Item added to inventory");
    setDialogOpen(false);
    setForm({ name: "", category: "general", quantity: "1", location: "", condition: "good", serial_number: "", purchase_date: "", purchase_cost: "0", notes: "" });
    fetchData();
  };

  const conditionColor: Record<string, string> = {
    excellent: "bg-success/10 text-success",
    good: "bg-info/10 text-info",
    fair: "bg-warning/10 text-warning",
    poor: "bg-destructive/10 text-destructive",
    damaged: "bg-destructive text-destructive-foreground",
  };

  const totalValue = items.reduce((sum, i) => sum + (Number(i.purchase_cost) * Number(i.quantity)), 0);
  const lowStock = items.filter((i) => i.available <= Math.ceil(i.quantity * 0.2));
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return <AdminLayout title="Inventory"><div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}</div></AdminLayout>;
  }

  return (
    <AdminLayout title="Inventory & Assets">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Package className="w-6 h-6 text-primary" /> Inventory & Assets</h2>
            <p className="text-sm text-muted-foreground mt-1">Track school equipment, furniture, and assets</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Laptop" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="lab_equipment">Lab Equipment</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="stationery">Stationery</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lab 2" /></div>
                  <div>
                    <Label>Condition</Label>
                    <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Serial No.</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
                  <div><Label>Cost (₦)</Label><Input type="number" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} /></div>
                </div>
                <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
                <Button className="w-full" onClick={handleSubmit}>Add to Inventory</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Box className="w-4 h-4 text-primary" /></div><div><p className="text-xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total Items</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><DollarSign className="w-4 h-4 text-success" /></div><div><p className="text-xl font-bold text-success">₦{totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Value</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="w-4 h-4 text-warning" /></div><div><p className="text-xl font-bold text-warning">{lowStock.length}</p><p className="text-xs text-muted-foreground">Low Stock</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-info/10"><CheckCircle className="w-4 h-4 text-info" /></div><div><p className="text-xl font-bold text-info">{items.filter((i) => i.condition === "good" || i.condition === "excellent").length}</p><p className="text-xs text-muted-foreground">Good Condition</p></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Inventory Items</CardTitle>
              <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input className="pl-8 h-8 w-48 text-xs" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Qty</TableHead>
                      <TableHead className="text-xs">Available</TableHead>
                      <TableHead className="text-xs">Condition</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{item.category}</Badge></TableCell>
                        <TableCell className="text-sm">{item.quantity}</TableCell>
                        <TableCell className={`text-sm font-medium ${item.available <= Math.ceil(item.quantity * 0.2) ? 'text-destructive' : ''}`}>{item.available}</TableCell>
                        <TableCell><Badge className={`text-xs ${conditionColor[item.condition] || ""}`}>{item.condition}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || "—"}</TableCell>
                        <TableCell className="text-sm">₦{(Number(item.purchase_cost) * item.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No inventory items yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
