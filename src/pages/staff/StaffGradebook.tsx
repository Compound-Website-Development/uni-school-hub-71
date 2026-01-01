import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const teacherData = {
  name: "Mr. Amadou Jallow",
  department: "Mathematics Dept.",
};

const classes = [
  { id: "10a", name: "Grade 10A", subject: "Mathematics", students: 32 },
  { id: "10b", name: "Grade 10B", subject: "Mathematics", students: 28 },
  { id: "11a", name: "Grade 11A", subject: "Mathematics", students: 30 },
  { id: "11b", name: "Grade 11B", subject: "Mathematics", students: 28 },
  { id: "12a", name: "Grade 12A", subject: "Additional Math", students: 24 },
];

const students = [
  { id: "34482024", name: "Binta Bah", ca: 17, exam: null },
  { id: "34482025", name: "Omar Ceesay", ca: 22, exam: null },
  { id: "34482026", name: "Fatou Jallow", ca: 25, exam: null },
  { id: "34482027", name: "Amadou Sowe", ca: 19, exam: null },
  { id: "34482028", name: "Mariama Fatty", ca: 28, exam: null },
  { id: "34482029", name: "Lamin Touray", ca: 14, exam: null },
  { id: "34482030", name: "Isatou Njie", ca: 21, exam: null },
  { id: "34482031", name: "Ebrima Camara", ca: 23, exam: null },
];

const StaffGradebook = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("term-3");
  const [grades, setGrades] = useState<Record<string, { ca: number; exam: number | null }>>(() => {
    const initial: Record<string, { ca: number; exam: number | null }> = {};
    students.forEach(s => {
      initial[s.id] = { ca: s.ca, exam: s.exam };
    });
    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateGrade = (studentId: string, field: "ca" | "exam", value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue },
    }));
  };

  const calculateTotal = (studentId: string) => {
    const grade = grades[studentId];
    if (grade.exam === null) return "-";
    return (grade.ca || 0) + (grade.exam || 0);
  };

  const calculateGrade = (total: number | string): string => {
    if (total === "-") return "-";
    const t = typeof total === "string" ? parseInt(total) : total;
    if (t >= 80) return "A";
    if (t >= 75) return "A-";
    if (t >= 70) return "B+";
    if (t >= 65) return "B";
    if (t >= 60) return "B-";
    if (t >= 55) return "C+";
    if (t >= 50) return "C";
    if (t >= 45) return "C-";
    if (t >= 40) return "D";
    return "F";
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Grades Saved!",
        description: "All grades have been successfully uploaded.",
      });
    }, 1500);
  };

  const handleSubmitForApproval = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Submitted for Approval",
        description: "Grades have been sent to the admin for validation.",
      });
    }, 1500);
  };

  return (
    <DashboardLayout
      userType="teacher"
      userName={teacherData.name}
      userSubtitle={teacherData.department}
      searchPlaceholder="Search students..."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Gradebook
            </h2>
            <p className="text-muted-foreground mt-1">
              Upload and manage student grades
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <span className="material-symbols-outlined mr-2">save</span>
              Save Draft
            </Button>
            <Button className="bg-gradient-primary" onClick={handleSubmitForApproval} disabled={isSaving}>
              <span className="material-symbols-outlined mr-2">send</span>
              Submit for Approval
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="animate-fade-up animation-delay-100">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject} ({cls.students} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium text-foreground mb-2 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term-1">First Term</SelectItem>
                    <SelectItem value="term-2">Second Term</SelectItem>
                    <SelectItem value="term-3">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card className="animate-fade-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Grade Entry - {selectedClass ? classes.find(c => c.id === selectedClass)?.name : "Select a class"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedClass ? (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-5xl mb-4">school</span>
                <p>Please select a class to view and enter grades</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student Name</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">CA (30)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Exam (70)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Total (100)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const total = calculateTotal(student.id);
                      const grade = calculateGrade(total);
                      return (
                        <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{student.id}</td>
                          <td className="py-3 px-4 font-medium text-foreground">{student.name}</td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={grades[student.id]?.ca || ""}
                              onChange={(e) => updateGrade(student.id, "ca", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="70"
                              value={grades[student.id]?.exam ?? ""}
                              onChange={(e) => updateGrade(student.id, "exam", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-foreground">{total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              grade === "A" || grade === "A-" ? "bg-success/10 text-success" :
                              grade === "B+" || grade === "B" || grade === "B-" ? "bg-primary/10 text-primary" :
                              grade === "C+" || grade === "C" || grade === "C-" ? "bg-warning/10 text-warning" :
                              grade === "F" ? "bg-destructive/10 text-destructive" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="animate-fade-up animation-delay-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-info">info</span>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Enter Continuous Assessment (CA) scores out of 30</li>
                  <li>Enter Exam scores out of 70</li>
                  <li>Total and Grade are calculated automatically</li>
                  <li>Click "Save Draft" to save your progress</li>
                  <li>Click "Submit for Approval" when all grades are complete</li>
                  <li>Once approved by admin, grades will be locked and visible to students</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffGradebook;
