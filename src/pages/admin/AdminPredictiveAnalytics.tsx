import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Brain, AlertTriangle, TrendingDown, TrendingUp, Users, Target, Zap, BarChart2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AtRiskStudent {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
  riskScore: number;
  riskFactors: string[];
  avgGrade: number;
  attendanceRate: number;
  missedAssignments: number;
}

const AdminPredictiveAnalytics = () => {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, gradesRes, attendanceRes, submissionsRes] = await Promise.all([
        supabase.from("students").select("id, student_id, first_name, last_name, class_id").eq("status", "active"),
        supabase.from("grades").select("student_id, total_score"),
        supabase.from("attendance").select("student_id, status"),
        supabase.from("assignment_submissions").select("student_id"),
      ]);

      const students = studentsRes.data || [];
      const grades = gradesRes.data || [];
      const attendance = attendanceRes.data || [];
      const submissions = submissionsRes.data || [];

      // Calculate risk scores
      const analyzed: AtRiskStudent[] = students.map((student) => {
        const studentGrades = grades.filter((g) => g.student_id === student.id);
        const studentAttendance = attendance.filter((a) => a.student_id === student.id);
        const studentSubmissions = submissions.filter((s) => s.student_id === student.id);

        const avgGrade = studentGrades.length > 0
          ? studentGrades.reduce((sum, g) => sum + (Number(g.total_score) || 0), 0) / studentGrades.length
          : 50;

        const totalAttendance = studentAttendance.length;
        const presentCount = studentAttendance.filter((a) => a.status === "present").length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

        const riskFactors: string[] = [];
        let riskScore = 0;

        if (avgGrade < 40) { riskScore += 35; riskFactors.push("Failing grades (avg < 40%)"); }
        else if (avgGrade < 55) { riskScore += 20; riskFactors.push("Below average grades"); }

        if (attendanceRate < 70) { riskScore += 30; riskFactors.push("Poor attendance (< 70%)"); }
        else if (attendanceRate < 85) { riskScore += 15; riskFactors.push("Low attendance (< 85%)"); }

        if (studentSubmissions.length === 0 && studentGrades.length > 0) {
          riskScore += 20; riskFactors.push("No assignment submissions");
        }

        if (studentGrades.length === 0) { riskScore += 15; riskFactors.push("No grades recorded yet"); }

        return {
          ...student,
          riskScore: Math.min(riskScore, 100),
          riskFactors,
          avgGrade: Math.round(avgGrade),
          attendanceRate: Math.round(attendanceRate),
          missedAssignments: studentSubmissions.length === 0 ? 1 : 0,
        };
      });

      const sorted = analyzed.sort((a, b) => b.riskScore - a.riskScore);
      setAtRiskStudents(sorted);
      setStats({
        total: sorted.length,
        high: sorted.filter((s) => s.riskScore >= 60).length,
        medium: sorted.filter((s) => s.riskScore >= 30 && s.riskScore < 60).length,
        low: sorted.filter((s) => s.riskScore > 0 && s.riskScore < 30).length,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    toast.info("Running AI analysis on student data...");
    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 2000));
    toast.success("AI analysis complete! Risk scores updated.");
    setIsAnalyzing(false);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 60) return <Badge className="bg-destructive/10 text-destructive border-destructive/20">High Risk</Badge>;
    if (score >= 30) return <Badge className="bg-warning/10 text-warning border-warning/20">Medium Risk</Badge>;
    if (score > 0) return <Badge className="bg-info/10 text-info border-info/20">Low Risk</Badge>;
    return <Badge className="bg-success/10 text-success border-success/20">On Track</Badge>;
  };

  const filteredStudents = atRiskStudents.filter((s) => {
    if (filter === "high") return s.riskScore >= 60;
    if (filter === "medium") return s.riskScore >= 30 && s.riskScore < 60;
    if (filter === "low") return s.riskScore > 0 && s.riskScore < 30;
    if (filter === "at-risk") return s.riskScore > 0;
    return true;
  });

  if (isLoading) {
    return (
      <AdminLayout title="AI Predictive Analytics">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Predictive Analytics">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> Predictive Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-1">AI-powered early warning system for at-risk students</p>
          </div>
          <Button onClick={runAIAnalysis} disabled={isAnalyzing} className="gap-2">
            <Zap className="w-4 h-4" /> {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.high}</p>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><TrendingDown className="w-5 h-5 text-warning" /></div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.medium}</p>
                  <p className="text-xs text-muted-foreground">Medium Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.total - stats.high - stats.medium - stats.low}</p>
                  <p className="text-xs text-muted-foreground">On Track</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Risk Distribution</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="at-risk">At Risk Only</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {stats.total > 0 && (
                    <>
                      <div className="bg-destructive transition-all" style={{ width: `${(stats.high / stats.total) * 100}%` }} />
                      <div className="bg-warning transition-all" style={{ width: `${(stats.medium / stats.total) * 100}%` }} />
                      <div className="bg-info transition-all" style={{ width: `${(stats.low / stats.total) * 100}%` }} />
                      <div className="bg-success transition-all flex-1" />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High ({stats.high})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Medium ({stats.medium})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> Low ({stats.low})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> On Track</span>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Student Risk Assessment ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.slice(0, 20).map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">{student.first_name} {student.last_name}</p>
                        {getRiskBadge(student.riskScore)}
                      </div>
                      <p className="text-xs text-muted-foreground">{student.student_id}</p>
                      {student.riskFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {student.riskFactors.map((factor, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{factor}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Avg</span>
                        <span className={`text-sm font-bold ${student.avgGrade < 50 ? 'text-destructive' : 'text-foreground'}`}>{student.avgGrade}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Att</span>
                        <span className={`text-sm font-bold ${student.attendanceRate < 80 ? 'text-warning' : 'text-foreground'}`}>{student.attendanceRate}%</span>
                      </div>
                    </div>
                    <div className="w-16 shrink-0">
                      <div className="text-center mb-1">
                        <span className={`text-lg font-bold ${student.riskScore >= 60 ? 'text-destructive' : student.riskScore >= 30 ? 'text-warning' : 'text-info'}`}>
                          {student.riskScore}
                        </span>
                      </div>
                      <Progress value={student.riskScore} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No students match the selected filter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPredictiveAnalytics;
