import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminLibrary = () => {
  const { toast } = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", quantity: "1", category: "" });

  const fetchBooks = async () => {
    const { data } = await supabase.from("library_books").select("*").order("title");
    setBooks(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleAdd = async () => {
    if (!form.title) { toast({ title: "Title required", variant: "destructive" }); return; }
    const qty = parseInt(form.quantity) || 1;
    const { error } = await supabase.from("library_books").insert({
      title: form.title, author: form.author || null, isbn: form.isbn || null,
      quantity: qty, available: qty, category: form.category || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Book added" });
    setForm({ title: "", author: "", isbn: "", quantity: "1", category: "" }); setDialogOpen(false);
    fetchBooks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("library_books").delete().eq("id", id);
    fetchBooks();
  };

  if (isLoading) {
    return <AdminLayout title="Library"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Library Management">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Library Catalog</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Book</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                <Input placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
                <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                <Button onClick={handleAdd} className="w-full">Add Book</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Category</TableHead><TableHead>Available</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No books in catalog.</TableCell></TableRow>
                ) : books.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>{b.author || "—"}</TableCell>
                    <TableCell>{b.category ? <Badge variant="secondary" className="text-xs">{b.category}</Badge> : "—"}</TableCell>
                    <TableCell>{b.available}/{b.quantity}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
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

export default AdminLibrary;
