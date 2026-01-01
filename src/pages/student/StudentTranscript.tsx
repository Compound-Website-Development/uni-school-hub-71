import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const studentData = {
  name: "BINTA BAH",
  id: "34482024",
  class: "GRADE 12",
  programme: "HUMANITIES STUDIES",
  admissionDate: "2022-09-01",
  graduationDate: "2025-07-31",
  status: "active",
};

const allTermsGrades = [
  {
    term: "2022/2023 - First Term",
    gpa: 3.52,
    subjects: [
      { subject: "English Language", grade: "B+", score: 72 },
      { subject: "General Mathematics", grade: "C+", score: 58 },
      { subject: "Science", grade: "B", score: 65 },
      { subject: "History", grade: "A-", score: 78 },
      { subject: "Islamic Studies", grade: "A", score: 88 },
    ],
  },
  {
    term: "2022/2023 - Second Term",
    gpa: 3.45,
    subjects: [
      { subject: "English Language", grade: "B", score: 68 },
      { subject: "General Mathematics", grade: "C", score: 55 },
      { subject: "Science", grade: "B+", score: 70 },
      { subject: "History", grade: "A-", score: 76 },
      { subject: "Islamic Studies", grade: "A", score: 85 },
    ],
  },
  {
    term: "2022/2023 - Third Term",
    gpa: 3.60,
    subjects: [
      { subject: "English Language", grade: "B+", score: 74 },
      { subject: "General Mathematics", grade: "C+", score: 56 },
      { subject: "Science", grade: "B", score: 66 },
      { subject: "History", grade: "A", score: 82 },
      { subject: "Islamic Studies", grade: "A", score: 90 },
    ],
  },
  {
    term: "2023/2024 - First Term",
    gpa: 3.48,
    subjects: [
      { subject: "English Language", grade: "B", score: 65 },
      { subject: "General Mathematics", grade: "C", score: 52 },
      { subject: "Government", grade: "B+", score: 72 },
      { subject: "History", grade: "A-", score: 78 },
      { subject: "Islamic Studies", grade: "A", score: 86 },
    ],
  },
  {
    term: "2023/2024 - Second Term",
    gpa: 3.42,
    subjects: [
      { subject: "English Language", grade: "B", score: 62 },
      { subject: "General Mathematics", grade: "C-", score: 48 },
      { subject: "Government", grade: "B+", score: 70 },
      { subject: "History", grade: "A-", score: 75 },
      { subject: "Islamic Studies", grade: "A", score: 85 },
    ],
  },
  {
    term: "2023/2024 - Third Term",
    gpa: 3.38,
    subjects: [
      { subject: "English Language", grade: "B-", score: 60 },
      { subject: "General Mathematics", grade: "C-", score: 45 },
      { subject: "Government", grade: "B", score: 68 },
      { subject: "History", grade: "A-", score: 76 },
      { subject: "Islamic Studies", grade: "A", score: 84 },
    ],
  },
  {
    term: "2024/2025 - First Term",
    gpa: 3.52,
    subjects: [
      { subject: "English Language", grade: "B", score: 64 },
      { subject: "General Mathematics", grade: "C", score: 50 },
      { subject: "Government", grade: "B+", score: 74 },
      { subject: "History", grade: "A-", score: 78 },
      { subject: "Islamic Studies", grade: "A", score: 88 },
    ],
  },
  {
    term: "2024/2025 - Second Term",
    gpa: 3.10,
    subjects: [
      { subject: "English Language", grade: "C+", score: 56 },
      { subject: "General Mathematics", grade: "D", score: 42 },
      { subject: "Government", grade: "B+", score: 70 },
      { subject: "History", grade: "A-", score: 75 },
      { subject: "Islamic Studies", grade: "A", score: 85 },
    ],
  },
  {
    term: "2024/2025 - Third Term",
    gpa: 2.55,
    subjects: [
      { subject: "English Language", grade: "F", score: 38 },
      { subject: "General Mathematics", grade: "F", score: 28 },
      { subject: "Government", grade: "B+", score: 72 },
      { subject: "History", grade: "A-", score: 75 },
      { subject: "Islamic Studies", grade: "A", score: 86 },
    ],
  },
];

// Calculate CGPA
const cgpa = (allTermsGrades.reduce((sum, term) => sum + term.gpa, 0) / allTermsGrades.length).toFixed(2);

const StudentTranscript = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const canDownloadTranscript = studentData.status === "graduated";

  const generateTranscriptPDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("JARRENG VILLAGE SCHOOLS", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Niamina East District, The Gambia", pageWidth / 2, 28, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL ACADEMIC TRANSCRIPT", pageWidth / 2, 40, { align: "center" });

      // Divider
      doc.setDrawColor(19, 127, 236);
      doc.setLineWidth(1);
      doc.line(20, 46, pageWidth - 20, 46);

      // Student Information
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Student Information", 20, 56);

      doc.setFont("helvetica", "normal");
      const studentInfo = [
        [`Student ID: ${studentData.id}`, `Name: ${studentData.name}`],
        [`Programme: ${studentData.programme}`, `Admission Date: ${studentData.admissionDate}`],
        [`Graduation Date: ${studentData.graduationDate}`, `CGPA: ${cgpa}`],
      ];

      let yPos = 64;
      studentInfo.forEach((row) => {
        doc.text(row[0], 20, yPos);
        doc.text(row[1], 110, yPos);
        yPos += 7;
      });

      // Academic Records
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("COMPLETE ACADEMIC RECORDS", 20, yPos);

      yPos += 8;

      // Create a summary table for each term
      allTermsGrades.forEach((term, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${term.term} (GPA: ${term.gpa.toFixed(2)})`, 20, yPos);
        yPos += 4;

        autoTable(doc, {
          startY: yPos,
          head: [["Subject", "Score", "Grade"]],
          body: term.subjects.map((s) => [s.subject, s.score.toString(), s.grade]),
          headStyles: {
            fillColor: [19, 127, 236],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
          },
          bodyStyles: {
            fontSize: 8,
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          margin: { left: 20, right: 20 },
          tableWidth: "auto",
        });

        yPos = (doc as any).lastAutoTable.finalY + 8;
      });

      // Final Summary
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CUMULATIVE SUMMARY", 20, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Cumulative Grade Point Average (CGPA): ${cgpa}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Terms Completed: ${allTermsGrades.length}`, 20, yPos);
      yPos += 7;
      doc.text(`Program Status: ${studentData.status === "graduated" ? "COMPLETED" : "IN PROGRESS"}`, 20, yPos);

      // Footer
      yPos += 20;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Registrar's Signature: ___________________", 20, yPos);
      doc.text("Principal's Signature: ___________________", 110, yPos);

      yPos += 15;
      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 20, yPos);
      doc.text("School Stamp:", 110, yPos);

      // Watermark-style disclaimer at bottom
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        "This transcript is an official document of Jarreng Village Schools.",
        pageWidth / 2,
        285,
        { align: "center" }
      );
      doc.text(
        "Any alterations or unauthorized reproductions will render this document void.",
        pageWidth / 2,
        290,
        { align: "center" }
      );

      // Save PDF
      doc.save(`Transcript_${studentData.id}_${studentData.name.replace(/\s+/g, "_")}.pdf`);

      toast({
        title: "Transcript Downloaded!",
        description: "Your official academic transcript has been saved as a PDF.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate transcript. Please try again.",
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Academic Transcript
          </h2>
          <p className="text-muted-foreground mt-1">
            Complete cumulative academic record
          </p>
        </div>

        {/* Status Card */}
        <Card className={`animate-fade-up animation-delay-100 ${canDownloadTranscript ? "border-success/50" : "border-warning/50"}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${canDownloadTranscript ? "bg-success/10" : "bg-warning/10"}`}>
                  <span className={`material-symbols-outlined text-2xl ${canDownloadTranscript ? "text-success" : "text-warning"}`}>
                    {canDownloadTranscript ? "verified" : "pending"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {canDownloadTranscript ? "Transcript Available" : "Transcript Preview"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {canDownloadTranscript
                      ? "Your official transcript is ready for download."
                      : "Official transcripts are available upon graduation. You can preview your records below."}
                  </p>
                </div>
              </div>
              <Button
                onClick={generateTranscriptPDF}
                disabled={isGenerating}
                className={canDownloadTranscript ? "bg-gradient-primary" : ""}
                variant={canDownloadTranscript ? "default" : "outline"}
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">download</span>
                    {canDownloadTranscript ? "Download Transcript" : "Preview PDF"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animation-delay-200">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{cgpa}</p>
              <p className="text-sm text-muted-foreground">CGPA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{allTermsGrades.length}</p>
              <p className="text-sm text-muted-foreground">Terms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">3</p>
              <p className="text-sm text-muted-foreground">Years</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant={canDownloadTranscript ? "default" : "secondary"} className="text-sm">
                {canDownloadTranscript ? "Graduated" : "In Progress"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Term Records */}
        <Card className="animate-fade-up animation-delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history_edu</span>
              Complete Academic History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {allTermsGrades.map((term, index) => (
                <div key={index} className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary/50 px-4 py-3 flex items-center justify-between">
                    <span className="font-semibold text-foreground">{term.term}</span>
                    <Badge variant="outline" className="font-bold">
                      GPA: {term.gpa.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {term.subjects.map((subject, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-muted-foreground truncate mb-1">{subject.subject}</p>
                          <p className={`text-lg font-bold ${
                            subject.grade.startsWith("A") ? "text-success" :
                            subject.grade.startsWith("B") ? "text-primary" :
                            subject.grade.startsWith("C") ? "text-warning" :
                            "text-destructive"
                          }`}>
                            {subject.grade}
                          </p>
                          <p className="text-xs text-muted-foreground">{subject.score}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentTranscript;
