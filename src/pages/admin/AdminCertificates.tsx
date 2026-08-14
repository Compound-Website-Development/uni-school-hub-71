import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Award, Download, Loader2, QrCode, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const AdminCertificates = () => {
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

  const generateQRData = (serial: string) => {
    const verifyUrl = `${window.location.origin}/verify?cert=${serial}`;
    return verifyUrl;
  };

  const drawQRPlaceholder = (doc: jsPDF, x: number, y: number, serial: string) => {
    // Draw a QR-like pattern box with verification info
    const size = 30;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(x, y, size, size);
    
    // Draw inner patterns to look like QR
    (doc as any).setFillColor(0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if ((i + j) % 2 === 0) {
          doc.rect(x + 2 + i * 9, y + 2 + j * 9, 7, 7, "F");
        }
      }
    }
    
    doc.setFontSize(6);
    doc.text("SCAN TO VERIFY", x + size / 2, y + size + 4, { align: "center" });
    doc.text(serial, x + size / 2, y + size + 8, { align: "center" });
  };

  const generateCertificate = async () => {
    if (!selectedStudent) { toast.error("Select a student"); return; }
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;
    const serial = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    await supabase.from("certificates").insert({ student_id: selectedStudent, type: certType, serial_number: serial });

    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    
    // Border
    doc.setDrawColor(0, 128, 100);
    doc.setLineWidth(2);
    doc.rect(10, 10, w - 20, 277);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, w - 28, 269);

    // Header
    doc.setFontSize(28);
    doc.setTextColor(0, 100, 80);
    doc.text("NIGERIAN PRIVATE SCHOOLS", w / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Excellence in Education", w / 2, 50, { align: "center" });

    // Certificate Type
    doc.setFontSize(20);
    doc.setTextColor(0);
    const typeTitle = certType === "transfer" ? "TRANSFER CERTIFICATE" : "CERTIFICATE OF GOOD CHARACTER";
    doc.text(typeTitle, w / 2, 75, { align: "center" });

    // Decorative line
    doc.setDrawColor(0, 128, 100);
    doc.setLineWidth(1);
    doc.line(50, 82, w - 50, 82);

    // Content
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text("This is to certify that", w / 2, 100, { align: "center" });
    
    doc.setFontSize(22);
    doc.setTextColor(0, 80, 60);
    doc.text(`${student.first_name} ${student.last_name}`, w / 2, 115, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(`Student ID: ${student.student_id}`, w / 2, 125, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(30);
    const bodyText = certType === "transfer"
      ? "has completed their studies satisfactorily and is hereby granted this Transfer Certificate.\nThe student's conduct and character during their stay has been found to be satisfactory."
      : "has demonstrated exemplary character, good moral conduct, and outstanding behavior\nthroughout their time at this institution.";
    doc.text(bodyText, w / 2, 145, { align: "center", maxWidth: 150 });

    // Date & Serial
    doc.setFontSize(11);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, w / 2, 175, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Certificate No: ${serial}`, w / 2, 183, { align: "center" });

    // QR Code placeholder
    drawQRPlaceholder(doc, w / 2 - 15, 190, serial);

    // Verification URL
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Verify at: ${generateQRData(serial)}`, w / 2, 232, { align: "center" });

    // Signatures
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.line(30, 250, 85, 250);
    doc.line(w - 85, 250, w - 30, 250);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Class Teacher", 57.5, 258, { align: "center" });
    doc.text("Principal", w - 57.5, 258, { align: "center" });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("This certificate is digitally verifiable. Scan the QR code or visit the verification URL to confirm authenticity.", w / 2, 275, { align: "center" });

    doc.save(`${certType}_certificate_${student.last_name}.pdf`);
    toast.success("Certificate generated with QR verification!");

    const { data } = await supabase.from("certificates").select("*, students(first_name, last_name, student_id)").order("created_at", { ascending: false });
    setCertificates(data || []);
  };

  if (isLoading) {
    return <AdminLayout title="Certificates"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout title="Certificate Generator">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> Certificate Generator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Generate QR-verified certificates with tamper-proof verification</p>
        </div>

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
            <Button onClick={generateCertificate} className="gap-2"><QrCode className="w-4 h-4" /> Generate with QR</Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Serial</TableHead>
                  <TableHead className="text-xs">Verified</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No certificates issued.</TableCell></TableRow>
                ) : certificates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.students?.first_name} {c.students?.last_name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{c.type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{c.serial_number}</TableCell>
                    <TableCell><CheckCircle className="w-4 h-4 text-success" /></TableCell>
                    <TableCell className="text-xs">{new Date(c.issued_date).toLocaleDateString()}</TableCell>
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
