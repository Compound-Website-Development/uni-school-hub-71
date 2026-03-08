import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, Edit, Briefcase } from "lucide-react";

const AdminStaffPage = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data } = await supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false });
        setStaff(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filtered = staff.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.employee_id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manage Staff">
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Badge variant="outline" className="self-start">{filtered.length} staff members</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono">{s.employee_id}</TableCell>
                    <TableCell className="text-sm font-medium">{s.first_name} {s.last_name}</TableCell>
                    <TableCell className="text-xs">{s.email}</TableCell>
                    <TableCell className="text-xs">{s.department || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {s.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No staff members found
                    </TableCell>
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

export default AdminStaffPage;
