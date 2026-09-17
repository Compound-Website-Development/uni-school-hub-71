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
import { BookOpen, Search, Save, Send, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AFFECTIVE_TRAITS,
  ASSESSMENT_WEIGHTS,
  PSYCHOMOTOR_SKILLS,
  letterGradeForScore,
} from "@/lib/schoolConfig";

interface ClassOption {
  id: string;
  name: string;
  school_type: string | null;
  grade_level: number;
  specialization: string | null;
  class_teacher_id: string | null;
}

interface Subject {
  id: string;
  name: string;
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
  session: string | null;
  is_current: boolean;
  term_number: number | null;
}

const StaffGradebook = () => {
  const { toast } = useToast();
  const { user, userRole, teacherData } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjectIds, setClassSubjectIds] = useState<string[] | null>(null);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState<string[] | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  
  // Filters
  const [schoolType, setSchoolType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  
  const [grades, setGrades] = useState<Record<string, { ca: number | null; exam: number | null; grade_id?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiComment, setAiComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<StudentGrade | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      const [classesRes, subjectsRes, termsRes] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, school_type, grade_level, specialization, class_teacher_id")
          .order("grade_level"),
        supabase
          .from("subjects")
          .select("id, name")
          .order("name"),
        supabase
          .from("terms")
          .select("id, name, session, is_current, term_number")
          .order("term_number"),
      ]);

      const allClasses = (classesRes.data || []) as ClassOption[];
      let visibleClasses = allClasses;
      let visibleSubjects = subjectsRes.data || [];

      // Class teachers work from their single assigned class. Subject teachers
      // can still use the existing class_subjects mapping for their classes.
      if (userRole !== "admin" && teacherData?.id) {
        const [{ data: mappedSubjects }] = await Promise.all([
          supabase
            .from("class_subjects")
            .select("class_id, subject_id")
            .eq("teacher_id", teacherData.id),
        ]);
        const assignedClassIds = allClasses
          .filter((classRow) => classRow.class_teacher_id === teacherData.id)
          .map((classRow) => classRow.id);
        const mappedClassIds = (mappedSubjects || []).map((row) => row.class_id).filter(Boolean);
        const visibleClassIds = new Set([...assignedClassIds, ...mappedClassIds]);
        visibleClasses = allClasses.filter((classRow) => visibleClassIds.has(classRow.id));

        // A class teacher can enter every subject for their assigned class.
        // Mapped subject teachers remain limited by their existing mappings.
        if (assignedClassIds.length === 0) {
          const subjectIds = new Set((mappedSubjects || []).map((row) => row.subject_id));
          visibleSubjects = visibleSubjects.filter((subject) => subjectIds.has(subject.id));
        }
      }

      setClasses(visibleClasses);
      setSubjects(visibleSubjects);
      if (userRole !== "admin" && visibleClasses.length === 1) {
        setSelectedClass(visibleClasses[0].id);
        setSchoolType(visibleClasses[0].school_type || "");
      }
      if (termsRes.data) {
        setTerms(termsRes.data);
        if (termsRes.data.length > 0) {
          setSelectedTerm((termsRes.data.find((term) => term.is_current) || termsRes.data[0]).id);
        }
      }

      setIsLoading(false);
    };

    fetchInitialData();
  }, [user, userRole, teacherData]);

  // Filter classes by school type
  const filteredClasses = schoolType
    ? classes.filter(c => c.school_type === schoolType)
    : classes;

  const schoolTypes = [...new Set(classes.map((classRow) => classRow.school_type).filter(Boolean))] as string[];

  const schoolTypeLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  // A mapped subject list is authoritative for a subject teacher or a class
  // teacher whose admin has bulk-mapped subjects. With no mappings, the class
  // teacher can enter every normal class subject.
  useEffect(() => {
    if (!selectedClass) {
      setClassSubjectIds(null);
      setTeacherSubjectIds(null);
      setSelectedSubject("");
      return;
    }

    const loadClassSubjects = async () => {
      const { data } = await supabase
        .from("class_subjects")
        .select("subject_id")
        .eq("class_id", selectedClass);
      const ids = (data || []).map((row) => row.subject_id).filter(Boolean) as string[];
      setClassSubjectIds(ids.length ? ids : null);

      if (userRole !== "admin" && teacherData?.id) {
        const { data: teacherLinks } = await supabase
          .from("class_subjects")
          .select("subject_id")
          .eq("class_id", selectedClass)
          .eq("teacher_id", teacherData.id);
        const teacherIds = (teacherLinks || []).map((row) => row.subject_id).filter(Boolean) as string[];
        setTeacherSubjectIds(teacherIds.length ? teacherIds : null);
        const isClassTeacher = classes.find((classRow) => classRow.id === selectedClass)?.class_teacher_id === teacherData.id;
        if (!isClassTeacher && selectedSubject && teacherIds.length && !teacherIds.includes(selectedSubject)) {
          setSelectedSubject("");
        }
      } else {
        setTeacherSubjectIds(null);
      }
    };

    loadClassSubjects();
  }, [selectedClass, selectedSubject, userRole, teacherData?.id, classes]);

  const isAssignedClassTeacher = classes.find((classRow) => classRow.id === selectedClass)?.class_teacher_id === teacherData?.id;
  const availableSubjects =
    userRole !== "admin" && teacherData?.id && isAssignedClassTeacher
      ? (teacherSubjectIds?.length ? subjects.filter((subject) => teacherSubjectIds.includes(subject.id)) : subjects)
      : userRole !== "admin" && teacherSubjectIds?.length
        ? subjects.filter((subject) => teacherSubjectIds.includes(subject.id))
        : subjects;

  // Fetch students and grades when class/term/subject changes
  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedSubject) {
      setStudents([]);
      setGrades({});
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setIsLoading(true);

      // Fetch students in this class
      const { data: studentData } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id")
        .eq("class_id", selectedClass)
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
        .eq("class_id", selectedClass)
        .eq("subject_id", selectedSubject)
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
        ca: gradeMap[s.id]?.ca ?? null,
        exam: gradeMap[s.id]?.exam ?? null,
        grade_id: gradeMap[s.id]?.grade_id,
      }));

      setStudents(studentGrades);
      setGrades(gradeMap);
      setIsLoading(false);
    };

    fetchStudentsAndGrades();
  }, [selectedClass, selectedTerm, selectedSubject]);

  // Filter students by search
  const filteredStudents = studentSearch
    ? students.filter(s => 
        s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const updateGrade = (studentId: string, field: "ca" | "exam", value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: numValue },
    }));
  };

  const calculateTotal = (studentId: string): number | string => {
    const grade = grades[studentId];
    if (!grade || (grade.ca === null && grade.exam === null)) return "-";
    return (grade.ca || 0) + (grade.exam || 0);
  };

  const calculateLetterGrade = (total: number | string): string => {
    if (total === "-") return "-";
    return letterGradeForScore(typeof total === "string" ? parseFloat(total) : total);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedTerm || !selectedSubject) {
      toast({ title: "Error", description: "Please select school, class, subject and term", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      for (const student of students) {
        const grade = grades[student.id];
        if (!grade) continue;

        const gradeRecord = {
          student_id: student.id,
          class_id: selectedClass,
          subject_id: selectedSubject,
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

      // Keep the aggregate result in sync with the subject rows. The student,
      // parent and report-card views all read this one term-level record.
      const { data: termGrades, error: summaryReadError } = await supabase
        .from("grades")
        .select("student_id, total_score")
        .eq("class_id", selectedClass)
        .eq("term_id", selectedTerm);
      if (summaryReadError) throw summaryReadError;

      const byStudent = (termGrades || []).reduce<Record<string, number[]>>((acc, row: any) => {
        (acc[row.student_id] ||= []).push(Number(row.total_score || 0));
        return acc;
      }, {});
      const summaryRows = Object.entries(byStudent).map(([student_id, scores]) => {
        const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
        return {
          student_id,
          term_id: selectedTerm,
          average,
          gpa: average === null ? null : Number((average / 20).toFixed(2)),
          affective: Object.fromEntries(AFFECTIVE_TRAITS.map((trait) => [trait, 0])),
          psychomotor: Object.fromEntries(PSYCHOMOTOR_SKILLS.map((skill) => [skill, 0])),
          is_published: false,
        };
      });
      if (summaryRows.length) {
        const { error: summaryError } = await supabase
          .from("term_results")
          .upsert(summaryRows, { onConflict: "student_id,term_id" });
        if (summaryError) throw summaryError;
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
    
    if (!selectedClass || !selectedSubject) return;

    try {
      await supabase
        .from("grades")
        .update({ status: "submitted" })
        .eq("class_id", selectedClass)
        .eq("subject_id", selectedSubject)
        .eq("term_id", selectedTerm)
        .eq("status", "draft");

      // A submission is visible to administrators for approval, but not yet
      // to pupils or parents.
      const { data: submittedGrades } = await supabase
        .from("grades")
        .select("student_id, total_score")
        .eq("class_id", selectedClass)
        .eq("term_id", selectedTerm);
      const submittedByStudent = (submittedGrades || []).reduce<Record<string, number[]>>((acc, row: any) => {
        (acc[row.student_id] ||= []).push(Number(row.total_score || 0));
        return acc;
      }, {});
      await Promise.all(Object.entries(submittedByStudent).map(([student_id, scores]) => {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return supabase.from("term_results").upsert({
          student_id,
          term_id: selectedTerm,
          average,
          gpa: Number((average / 20).toFixed(2)),
          affective: Object.fromEntries(AFFECTIVE_TRAITS.map((trait) => [trait, 0])),
          psychomotor: Object.fromEntries(PSYCHOMOTOR_SKILLS.map((skill) => [skill, 0])),
          is_published: false,
        }, { onConflict: "student_id,term_id" });
      }));

      toast({ title: "Submitted!", description: "Grades submitted for admin approval." });
    } catch (error) {
      console.error("Error submitting grades:", error);
      toast({ title: "Error", description: "Failed to submit grades", variant: "destructive" });
    }
  };

  const generateAIComment = async (student: StudentGrade) => {
    setSelectedStudentForAI(student);
    setAiDialogOpen(true);
    setIsGenerating(true);
    setAiComment("");

    const grade = grades[student.id];
    const total = grade ? (grade.ca || 0) + (grade.exam || 0) : 0;
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Subject";

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "report_comment",
          messages: [{ role: "user", content: `Generate a report card comment for this student.` }],
          studentData: {
            name: student.student_name,
            subject: subjectName,
            ca_score: grade?.ca,
            exam_score: grade?.exam,
            total_score: total,
            max_total: 100,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({ title: "AI Error", description: err.error || "Could not generate comment", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      const data = await resp.json();
      setAiComment(data.comment || "Unable to generate comment.");
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to connect to AI service", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <StaffLayout title="Gradebook">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Grade Entry</h2>
            <p className="text-muted-foreground text-sm">Upload student grades by class and subject</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSave} disabled={isSaving || !selectedClass || !selectedSubject}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSubmitForApproval} disabled={isSaving || !selectedClass || !selectedSubject}>
              <Send className="w-4 h-4 mr-2" />
              Submit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* School Type */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">School</label>
                  <Select value={schoolType} onValueChange={(v) => {
                  setSchoolType(v);
                  setSelectedClass("");
                  }} disabled={userRole !== "admin" && classes.length <= 1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolTypes.map((type) => (
                      <SelectItem key={type} value={type}>{schoolTypeLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Class</label>
                  <Select value={selectedClass} onValueChange={(value) => { setSelectedClass(value); setSelectedSubject(""); }} disabled={!filteredClasses.length}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subj) => (
                      <SelectItem key={subj.id} value={subj.id}>{subj.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Term */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Term</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}{term.session ? ` — ${term.session}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Search */}
            {selectedClass && selectedSubject && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name or ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Grade Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : !selectedClass || !selectedSubject ? (
              <InlineEmptyState icon={BookOpen} title="Select Class & Subject" description="Choose a school, class and subject above to view and enter grades" />
            ) : filteredStudents.length === 0 ? (
              <InlineEmptyState icon={BookOpen} title="No Students" description={studentSearch ? "No students match your search" : "No students found in this class"} />
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">CA ({ASSESSMENT_WEIGHTS.ca})</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-24">Exam ({ASSESSMENT_WEIGHTS.exam})</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-20">Grade</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-foreground w-16">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => {
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
                              max={ASSESSMENT_WEIGHTS.ca}
                              value={grades[student.id]?.ca ?? ""}
                              onChange={(e) => updateGrade(student.id, "ca", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              max={ASSESSMENT_WEIGHTS.exam}
                              value={grades[student.id]?.exam ?? ""}
                              onChange={(e) => updateGrade(student.id, "exam", e.target.value)}
                              className="w-20 mx-auto text-center"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-foreground">{total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              letterGrade === "A" ? "bg-success/10 text-success" :
                              letterGrade.startsWith("B") ? "bg-primary/10 text-primary" :
                              letterGrade.startsWith("C") ? "bg-warning/10 text-warning" :
                              letterGrade === "F" ? "bg-destructive/10 text-destructive" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {letterGrade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Generate AI Comment"
                              onClick={() => generateAIComment(student)}
                              disabled={!grades[student.id]?.exam}
                            >
                              <Sparkles className="w-4 h-4 text-accent" />
                            </Button>
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

        {/* AI Comment Dialog */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI Report Card Comment
              </DialogTitle>
            </DialogHeader>
            {selectedStudentForAI && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Student: <span className="font-medium text-foreground">{selectedStudentForAI.student_name}</span>
                </p>
                {isGenerating ? (
                  <div className="flex items-center gap-2 py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Generating comment...</span>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={aiComment}
                      onChange={(e) => setAiComment(e.target.value)}
                      rows={5}
                      className="text-sm"
                      placeholder="AI-generated comment will appear here..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => generateAIComment(selectedStudentForAI)}>
                        <Sparkles className="w-4 h-4 mr-1" /> Regenerate
                      </Button>
                      <Button onClick={() => {
                        navigator.clipboard.writeText(aiComment);
                        toast({ title: "Copied!", description: "Comment copied to clipboard" });
                        setAiDialogOpen(false);
                      }}>
                        Copy Comment
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StaffLayout>
  );
};

export default StaffGradebook;