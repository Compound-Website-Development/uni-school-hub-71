import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const studentData = {
  name: "BINTA BAH",
  id: "34482024",
  class: "GRADE 10 SAFFIAH 1",
  programme: "HUMANITIES STUDIES",
};

const terms = [
  { id: "term-3-2024", label: "2024/2025 - Third Term", available: true },
  { id: "term-2-2024", label: "2024/2025 - Second Term", available: true },
  { id: "term-1-2024", label: "2024/2025 - First Term", available: true },
];

const gradesData = [
  { subject: "CIVIC EDUCATION", ca: 14, exam: 54, total: 68, grade: "B+", remark: "VERY GOOD" },
  { subject: "ENGLISH LANGUAGE", ca: 22, exam: 16, total: 38, grade: "F", remark: "FAIL" },
  { subject: "GENERAL MATHEMATICS", ca: 17, exam: 11, total: 28, grade: "F", remark: "FAIL" },
  { subject: "GOVERNMENT", ca: 20, exam: 52, total: 72, grade: "B+", remark: "VERY GOOD" },
  { subject: "HISTORY", ca: 21, exam: 54, total: 75, grade: "A-", remark: "EXCELLENT" },
  { subject: "ISLAMIC STUDIES", ca: 29, exam: 57, total: 86, grade: "A", remark: "EXCELLENT" },
  { subject: "LITERATURE-IN-ENGLISH", ca: 24, exam: 39, total: 63, grade: "B", remark: "VERY GOOD" },
  { subject: "PHYSICAL HEALTH EDUCATION", ca: 22, exam: 50, total: 72, grade: "B+", remark: "VERY GOOD" },
  { subject: "SCIENCE", ca: 18, exam: 42, total: 60, grade: "B", remark: "VERY GOOD" },
];

const StudentReports = () => {
  const { toast } = useToast();
  const [selectedTerm, setSelectedTerm] = useState("term-3-2024");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("JARRENG VILLAGE SCHOOLS", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Niamina East District, The Gambia", pageWidth / 2, 28, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("TERM REPORT", pageWidth / 2, 40, { align: "center" });
      
      // Divider line
      doc.setDrawColor(19, 127, 236);
      doc.setLineWidth(0.5);
      doc.line(20, 45, pageWidth - 20, 45);
      
      // Student Info
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Student Information", 20, 55);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Student ID: ${studentData.id}`, 20, 63);
      doc.text(`Student Name: ${studentData.name}`, 20, 70);
      doc.text(`Class: ${studentData.class}`, 20, 77);
      doc.text(`Programme: ${studentData.programme}`, 20, 84);
      doc.text(`Term: 2024/2025 ACADEMIC YEAR THIRD TERM`, 20, 91);
      
      // Academic Records
      doc.setFont("helvetica", "bold");
      doc.text("ACADEMIC RECORDS", 20, 105);
      
      // Table
      autoTable(doc, {
        startY: 110,
        head: [["Subject", "CA", "Exam", "Total", "Grade", "Remark"]],
        body: gradesData.map(row => [
          row.subject,
          row.ca.toString(),
          row.exam.toString(),
          row.total.toString(),
          row.grade,
          row.remark,
        ]),
        headStyles: {
          fillColor: [19, 127, 236],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 15, halign: "center" },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 15, halign: "center" },
          5: { cellWidth: 35, halign: "left" },
        },
      });
      
      // GPA & Position
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFont("helvetica", "bold");
      doc.text(`GPA: 2.55`, 20, finalY);
      doc.text(`CGPA: 3.06`, 80, finalY);
      doc.text(`Class Position: 12th OUT OF 44`, 140, finalY);
      
      // Comments
      doc.text("Class Teacher's Comments:", 20, finalY + 15);
      doc.setFont("helvetica", "normal");
      doc.text("CREDIT.", 75, finalY + 15);
      
      // Signatures
      doc.setFont("helvetica", "normal");
      doc.text("Class Teacher's Signature: ___________________", 20, finalY + 30);
      doc.text("Principal's Signature: ___________________", 110, finalY + 30);
      
      // Footer
      doc.setFontSize(8);
      doc.text("Thank You For Being Part Of Jarreng Village Schools", pageWidth / 2, 280, { align: "center" });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 286, { align: "center" });
      
      // Save
      doc.save(`Term_Report_${studentData.id}_${studentData.name.replace(/\s+/g, "_")}.pdf`);
      
      toast({
        title: "Report Downloaded!",
        description: "Your term report has been saved as a PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout
      userType="student"
      userName={studentData.name}
      userSubtitle={`ID: ${studentData.id}`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Term Reports
          </h2>
          <p className="text-muted-foreground mt-1">
            Download your academic reports in PDF format
          </p>
        </div>

        {/* Report Selection */}
        <Card className="animate-fade-up animation-delay-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              Select Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">Academic Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id} disabled={!term.available}>
                        {term.label}
                        {!term.available && " (Not Available)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={generatePDF} 
                  disabled={isGenerating}
                  className="bg-gradient-primary w-full sm:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined mr-2">download</span>
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card className="animate-fade-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">preview</span>
              Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Preview Header */}
            <div className="bg-gradient-primary text-primary-foreground p-6 rounded-t-lg">
              <h3 className="text-xl font-bold text-center">JARRENG VILLAGE SCHOOLS</h3>
              <p className="text-center opacity-80 text-sm mt-1">Niamina East District, The Gambia</p>
              <p className="text-center font-semibold mt-4">TERM REPORT</p>
            </div>
            
            {/* Student Info */}
            <div className="p-4 bg-secondary/30 border-b border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="ml-2 font-medium text-foreground">{studentData.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium text-foreground">{studentData.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>
                  <span className="ml-2 font-medium text-foreground">{studentData.class}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Programme:</span>
                  <span className="ml-2 font-medium text-foreground">{studentData.programme}</span>
                </div>
              </div>
            </div>

            {/* Grades Table Preview */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Subject</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">CA</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Exam</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Grade</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{row.subject}</td>
                      <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.ca}</td>
                      <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.exam}</td>
                      <td className="py-3 px-4 text-sm text-center font-semibold text-foreground">{row.total}</td>
                      <td className="py-3 px-4 text-sm text-center font-bold text-primary">{row.grade}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{row.remark}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td colSpan={6} className="py-3 px-4 text-center text-sm text-muted-foreground">
                      ... and {gradesData.length - 5} more subjects
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-4 bg-secondary/30 rounded-b-lg flex flex-wrap gap-6">
              <div>
                <span className="text-sm text-muted-foreground">GPA:</span>
                <span className="ml-2 text-lg font-bold text-primary">2.55</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CGPA:</span>
                <span className="ml-2 text-lg font-bold text-success">3.06</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Position:</span>
                <span className="ml-2 text-lg font-bold text-warning">12th/44</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transcript Card */}
        <Card className="animate-fade-up animation-delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-success">school</span>
              Academic Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-foreground">Full Academic Transcript</p>
                <p className="text-sm text-muted-foreground">
                  View your complete academic history across all terms.
                </p>
              </div>
              <Link to="/student/transcript">
                <Button variant="outline">
                  <span className="material-symbols-outlined mr-2">history_edu</span>
                  View Transcript
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentReports;
