import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, BarChart3, Trophy, FileText, History } from "lucide-react";

interface Grade {
  id: string;
  continuous_assessment: number | null;
  exam_score: number | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
  subjects: { name: string } | null;
  terms: { id: string; name: string } | null;
}

interface TermResult {
  gpa: number | null;
  class_position: number | null;
  class_size: number | null;
  terms: { id: string; name: string } | null;
}

interface GroupedGrades {
  [termId: string]: {
    termName: string;
    grades: Grade[];
    gpa: number | null;
  };
}

const StudentGrades = () => {
  const { studentData } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [termResults, setTermResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentData?.id) return;

      try {
        // Fetch all grades for the student
        const { data: gradesData } = await supabase
          .from("grades")
          .select(`
            id,
            continuous_assessment,
            exam_score,
            total_score,
            letter_grade,
            remark,
            subjects (name),
            terms (id, name)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false });

        if (gradesData) {
          setGrades(gradesData);
        }

        // Fetch term results
        const { data: results } = await supabase
          .from("term_results")
          .select(`
            gpa,
            class_position,
            class_size,
            terms (id, name)
          `)
          .eq("student_id", studentData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (results) {
          setTermResults(results);
        }

        // Fetch current term
        const { data: currentTerm } = await supabase
          .from("terms")
          .select("id")
          .eq("is_current", true)
          .maybeSingle();

        if (currentTerm) {
          setCurrentTermId(currentTerm.id);
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentData?.id]);

  // Group grades by term
  const groupedGrades: GroupedGrades = grades.reduce((acc, grade) => {
    const termId = grade.terms?.id || "unknown";
    const termName = grade.terms?.name || "Unknown Term";
    
    if (!acc[termId]) {
      const termResult = termResults.find(tr => tr.terms?.id === termId);
      acc[termId] = {
        termName,
        grades: [],
        gpa: termResult?.gpa || null,
      };
    }
    acc[termId].grades.push(grade);
    return acc;
  }, {} as GroupedGrades);

  const currentTermResult = termResults[0];
  
  // Calculate cumulative GPA
  const cumulativeGpa = termResults.length > 0
    ? termResults.reduce((sum, tr) => sum + (tr.gpa || 0), 0) / termResults.length
    : null;

  const currentTermGrades = currentTermId ? groupedGrades[currentTermId] : null;
  const previousTerms = Object.entries(groupedGrades).filter(([id]) => id !== currentTermId);

  return (
    <StudentLayout title="My Grades">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            My Grades
          </h2>
          <p className="text-muted-foreground mt-1">
            View your academic performance
          </p>
        </div>

        {/* GPA Summary */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="w-5 h-5 mb-1 opacity-80" />
                  <p className="text-xs opacity-80">Term GPA</p>
                  <p className="text-2xl font-bold">
                    {currentTermResult?.gpa?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <BarChart3 className="w-5 h-5 mb-1 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">CGPA</p>
                  <p className="text-2xl font-bold text-foreground">
                    {cumulativeGpa?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <Trophy className="w-5 h-5 mb-1 text-amber-500" />
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="text-2xl font-bold text-foreground">
                    {currentTermResult?.class_position || "N/A"}
                    {currentTermResult?.class_size && (
                      <span className="text-sm text-muted-foreground">/{currentTermResult.class_size}</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grades Tables */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="current">Current Term</TabsTrigger>
            <TabsTrigger value="previous">Previous Terms</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            {loading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : currentTermGrades?.grades.length ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {currentTermGrades.termName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentTermGrades.grades.map((grade) => (
                      <div
                        key={grade.id}
                        className={`p-3 rounded-lg border ${
                          grade.letter_grade === "F" 
                            ? "bg-destructive/5 border-destructive/20" 
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground text-sm">
                            {grade.subjects?.name || "Unknown Subject"}
                          </p>
                          <GradeBadge grade={grade.letter_grade || "N/A"} size="sm" />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>CA: {grade.continuous_assessment || 0}</span>
                          <span>Exam: {grade.exam_score || 0}</span>
                          <span className="font-medium text-foreground">
                            Total: {grade.total_score || 0}
                          </span>
                        </div>
                        {grade.remark && (
                          <p className={`text-xs mt-1 ${
                            grade.letter_grade === "F" ? "text-destructive" : "text-muted-foreground"
                          }`}>
                            {grade.remark}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* GPA Summary */}
                  {currentTermGrades.gpa && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Term GPA</span>
                      <span className="text-lg font-bold text-primary">
                        {currentTermGrades.gpa.toFixed(2)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No grades available for current term</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="mt-4 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : previousTerms.length > 0 ? (
              previousTerms.map(([termId, termData]) => (
                <Card key={termId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        {termData.termName}
                      </span>
                      {termData.gpa && (
                        <span className="text-primary font-bold">
                          GPA: {termData.gpa.toFixed(2)}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {termData.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {grade.subjects?.name || "Unknown Subject"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total: {grade.total_score || 0}
                            </p>
                          </div>
                          <GradeBadge grade={grade.letter_grade || "N/A"} size="sm" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No previous term grades available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
};

export default StudentGrades;
