import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Award, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const AdminCertificates = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [certType, setCertType] = useState("transfer");

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, cRes] = await Promise.all([
        supabase.from("students").select("*").eq("status", "active").order("first_name"),
        supabase.from("certificates").select("*, students(first_name, last_name, student_id)").order("created_at", { ascending: false }),
      ]);
      setStudents(sRes.data || []);
      setCertificates(cRes.data || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const generateCertificate = async () => {
    if (!selectedStudent) { toast({ title: "Select a student", variant: "destructive" }); return; }
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;
    const serial = `CERT-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("certificates").insert({ student_id: selectedStudent, type: certType, serial_number: serial });

    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text("NIGERIAN PRIVATE SCHOOLS", 105, 30, { align: "center" });
    doc.setFontSize(16);
    doc.text(certType === "transfer" ? "TRANSFER CERTIFICATE" : "CHARACTER CERTIFICATE", 105, 45, { align: "center" });
    doc.setFontSize(12);
    doc.text(`This is to certify that ${student.first_name} ${student.last_name}`, 105, 70, { align: "center" });
    doc.text(`Student ID: ${student.student_id}`, 105, 80, { align: "center" });
    doc.text(certType === "transfer"
      ? "has completed their studies and is hereby granted this Transfer Certificate."
      : "has demonstrated exemplary character and is hereby granted this Certificate of Good Character.",
    105, 95, { align: "center", maxWidth: 150 });
    doc.text(`Serial: ${serial}`, 105, 120, { align: "center" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 130, { align: "center" });
    doc.text("_________________________", 105, 160, { align: "center" });
    doc.text("Principal", 105, 168, { align: "center" });
    doc.save(`${certType}_certificate_${student.last_name}.pdf`);
    toast({ title: "Certificate generated" });

    const { data } = await supabase.from("certificates").select("*, students(first_name, last_name, student_id)").order("created_at", { ascending: false });
    setCertificates(data || []);
  };

  if (isLoading) {
    return <AdminLayout title="Certificates"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Certificate Generator">
      <div className="space-y-6 animate-fade-in">
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={certType} onValueChange={setCertType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateCertificate}><Download className="w-4 h-4 mr-2" /> Generate</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Serial</TableHead><TableHead>Date</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {certificates.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No certificates issued.</TableCell></TableRow>
                ) : certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.students?.first_name} {c.students?.last_name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{c.type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{c.serial_number}</TableCell>
                    <TableCell>{new Date(c.issued_date).toLocaleDateString()}</TableCell>
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

export default AdminCertificates;
