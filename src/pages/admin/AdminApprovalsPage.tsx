import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Check, X } from "lucide-react";
import { toast } from "sonner";

const AdminApprovalsPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setApplications(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from("applications").update({ status: "accepted", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (!error) { toast.success("Application approved"); fetchPending(); }
    else toast.error("Failed to approve");
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from("applications").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (!error) { toast.success("Application rejected"); fetchPending(); }
    else toast.error("Failed to reject");
  };

  return (
    <AdminLayout title="Pending Approvals">
      <div className="space-y-5 animate-fade-in">
        <p className="text-sm text-muted-foreground">{applications.length} pending application(s) requiring review.</p>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">App ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Programme</TableHead>
                  <TableHead className="text-xs">Applied</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-xs font-mono">{app.application_id}</TableCell>
                    <TableCell className="text-sm font-medium">{app.first_name} {app.last_name}</TableCell>
                    <TableCell className="text-xs">{app.email}</TableCell>
                    <TableCell className="text-xs">{app.programme}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-7 text-xs bg-success hover:bg-success/90" onClick={() => handleApprove(app.id)}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => handleReject(app.id)}>
                          <X className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No pending approvals
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

export default AdminApprovalsPage;
