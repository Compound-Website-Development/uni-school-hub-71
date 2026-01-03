import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { InlineEmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  subject_name: string;
  subject_id: string;
}

interface StudentGrade {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  ca: number | null;
  exam: number | null;
  grade_id?: string;
}

interface Term {
  id: string;
  name: string;
}

const StaffGradebook = () => {
  const { toast } = useToast();
  const { teacherData } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [grades, setGrades] = useState<Record<string, { ca: number | null; exam: number | null; grade_id?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch classes and terms
  useEffect(() => {
    const fetchInitialData = async () => {
      const [classesRes, termsRes] = await Promise.all([
        supabase
          .from("class_subjects")
          .select(`
            class_id,
            subject_id,
            classes (id, name),
            subjects (id, name)
          `)
          .order("class_id"),
        supabase
          .from("terms")
          .select("id, name")
          .order("term_number"),
      ]);

      if (classesRes.data) {
        const uniqueClasses: ClassOption[] = [];
        const seen = new Set();
        classesRes.data.forEach((cs: any) => {
          const key = `${cs.class_id}-${cs.subject_id}`;
          if (!seen.has(key) && cs.classes && cs.subjects) {
            seen.add(key);
            uniqueClasses.push({
              id: cs.class_id,
              name: cs.classes.name,
              subject_name: cs.subjects.name,
              subject_id: cs.subject_id,
            });
          }
        });
        setClasses(uniqueClasses);
      }

      if (termsRes.data) {
        setTerms(termsRes.data);
        if (termsRes.data.length > 0) {
          setSelectedTerm(termsRes.data[termsRes.data.length - 1].id);
        }
      }

      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  // Fetch students and grades when class/term changes
  useEffect(() => {
    if (!selectedClass || !selectedTerm) {
      setStudents([]);
      setGrades({});
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setIsLoading(true);

      // Get the selected class info
      const selectedClassInfo = classes.find(c => `${c.id}-${c.subject_id}` === selectedClass);
      if (!selectedClassInfo) {
        setIsLoading(false);
        return;
      }

      setSelectedSubjectId(selectedClassInfo.subject_id);

      // Fetch students in this class
      const { data: studentData } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id")
        .eq("class_id", selectedClassInfo.id)
        .eq("status", "active")
        .order("last_name");

      if (!studentData || studentData.length === 0) {
        setStudents([]);
        setGrades({});
        setIsLoading(false);
        return;
      }

      // Fetch existing grades
      const { data: gradeData } = await supabase
        .from("grades")
        .select("id, student_id, continuous_assessment, exam_score")
        .eq("class_id", selectedClassInfo.id)
        .eq("subject_id", selectedClassInfo.subject_id)
        .eq("term_id", selectedTerm);

      const gradeMap: Record<string, { ca: number | null; exam: number | null; grade_id?: string }> = {};
      gradeData?.forEach((g) => {
        gradeMap[g.student_id] = {
          ca: g.continuous_assessment,
          exam: g.exam_score,
          grade_id: g.id,
        };
      });

      const studentGrades: StudentGrade[] = studentData.map((s) => ({
        id: s.id,
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        student_code: s.student_id,
        ca: gradeMap[s.id]?.ca || null,
        exam: gradeMap[s.id]?.exam || null,
        grade_id: gradeMap[s.id]?.grade_id,
      }));

      setStudents(studentGrades);
      setGrades(gradeMap);
      setIsLoading(false);
    };

    fetchStudentsAndGrades();
  }, [selectedClass, selectedTerm, classes]);

  const updateGrade = (studentId: string, field: "ca" | "exam", value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue },
    }));
  };

  const calculateTotal = (studentId: string): number | string => {
    const grade = grades[studentId];
    if (!grade || grade.exam === null) return "-";
    return (grade.ca || 0) + (grade.exam || 0);
  };

  const calculateLetterGrade = (total: number | string): string => {
    if (total === "-") return "-";
    const t = typeof total === "string" ? parseFloat(total) : total;
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

  const handleSave = async () => {
    if (!selectedClass || !selectedTerm || !selectedSubjectId) {
      toast({ title: "Error", description: "Please select a class and term", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const selectedClassInfo = classes.find(c => `${c.id}-${c.subject_id}` === selectedClass);
    if (!selectedClassInfo) {
      setIsSaving(false);
      return;
    }

    try {
      for (const student of students) {
        const grade = grades[student.id];
        if (!grade) continue;

        const gradeRecord = {
          student_id: student.id,
          class_id: selectedClassInfo.id,
          subject_id: selectedSubjectId,
          term_id: selectedTerm,
          continuous_assessment: grade.ca,
          exam_score: grade.exam,
          status: "draft" as const,
          entered_by: teacherData?.id || null,
        };

        if (grade.grade_id) {
          await supabase.from("grades").update(gradeRecord).eq("id", grade.grade_id);
        } else if (grade.ca !== null || grade.exam !== null) {
          await supabase.from("grades").insert(gradeRecord);
        }
      }

      toast({ title: "Saved!", description: "Grades have been saved as draft." });
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({ title: "Error", description: "Failed to save grades", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    await handleSave();
    
    const selectedClassInfo = classes.find(c => `${c.id}-${c.subject_id}` === selectedClass);
    if (!selectedClassInfo) return;

    try {
      await supabase
        .from("grades")
        .update({ status: "submitted" })
        .eq("class_id", selectedClassInfo.id)
        .eq("subject_id", selectedSubjectId)
        .eq("term_id", selectedTerm)
        .eq("status", "draft");

      toast({ title: "Submitted!", description: "Grades submitted for admin approval." });
    } catch (error) {
      console.error("Error submitting grades:", error);
      toast({ title: "Error", description: "Failed to submit grades", variant: "destructive" });
    }
  };

  return (
    <StaffLayout title="Gradebook">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Grade Entry</h2>
            <p className="text-muted-foreground text-sm">Upload and manage student grades</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={isSaving || !selectedClass}>
              <span className="material-symbols-outlined mr-2 text-lg">save</span>
              Save Draft
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSaving || !selectedClass}>
              <span className="material-symbols-outlined mr-2 text-lg">send</span>
              Submit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-2 block">Class & Subject</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={`${cls.id}-${cls.subject_id}`} value={`${cls.id}-${cls.subject_id}`}>
                        {cls.name} - {cls.subject_name}
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
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>{term.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Grade Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : !selectedClass ? (
              <InlineEmptyState icon={BookOpen} title="Select a Class" description="Choose a class above to view and enter grades" />
            ) : students.length === 0 ? (
              <InlineEmptyState icon={BookOpen} title="No Students" description="No students found in this class" />
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">CA (30)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">Exam (70)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const total = calculateTotal(student.id);
                      const letterGrade = calculateLetterGrade(total);
                      return (
                        <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4">
                            <p className="font-medium text-foreground">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">{student.student_code}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              value={grades[student.id]?.ca ?? ""}
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
                              letterGrade === "A" || letterGrade === "A-" ? "bg-success/10 text-success" :
                              letterGrade.startsWith("B") ? "bg-primary/10 text-primary" :
                              letterGrade.startsWith("C") ? "bg-warning/10 text-warning" :
                              letterGrade === "F" ? "bg-destructive/10 text-destructive" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {letterGrade}
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
      </div>
    </StaffLayout>
  );
};

export default StaffGradebook;
