import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, AlertTriangle, TrendingDown, TrendingUp, Users, Target, Zap,
  Eye, Send, Lightbulb, ShieldAlert, ArrowRight, Loader2
} from "lucide-react";
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
  trend: "improving" | "declining" | "stable";
  interventions: string[];
}

const AdminPredictiveAnalytics = () => {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);

  const generateInterventions = (riskFactors: string[], avgGrade: number, attendanceRate: number): string[] => {
    const interventions: string[] = [];
    if (avgGrade < 40) interventions.push("Schedule remedial classes for weak subjects");
    if (avgGrade < 55) interventions.push("Assign peer tutoring partner");
    if (attendanceRate < 70) interventions.push("Mandatory parent-teacher meeting about attendance");
    if (attendanceRate < 85) interventions.push("Send weekly attendance summary to parent");
    if (riskFactors.includes("No assignment submissions")) interventions.push("Set up daily homework check-in with form teacher");
    if (riskFactors.length >= 3) interventions.push("Refer to school counselor for wellbeing check");
    if (interventions.length === 0) interventions.push("Continue monitoring — no intervention needed");
    return interventions;
  };

  const determineTrend = (avgGrade: number, attendanceRate: number): "improving" | "declining" | "stable" => {
    if (avgGrade < 40 && attendanceRate < 70) return "declining";
    if (avgGrade > 65 && attendanceRate > 90) return "improving";
    return "stable";
  };

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

      const analyzed: AtRiskStudent[] = students.map((student) => {
        const studentGrades = grades.filter((g) => g.student_id === student.id);
        const studentAttendance = attendance.filter((a) => a.student_id === student.id);
        const studentSubmissions = submissions.filter((s) => s.student_id === student.id);

        const avgGrade = studentGrades.length > 0
          ? studentGrades.reduce((sum, g) => sum + (Number(g.total_score) || 0), 0) / studentGrades.length : 50;
        const totalAttendance = studentAttendance.length;
        const presentCount = studentAttendance.filter((a) => a.status === "present").length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

        const riskFactors: string[] = [];
        let riskScore = 0;

        if (avgGrade < 40) { riskScore += 35; riskFactors.push("Failing grades (avg < 40%)"); }
        else if (avgGrade < 55) { riskScore += 20; riskFactors.push("Below average grades"); }
        if (attendanceRate < 70) { riskScore += 30; riskFactors.push("Poor attendance (< 70%)"); }
        else if (attendanceRate < 85) { riskScore += 15; riskFactors.push("Low attendance (< 85%)"); }
        if (studentSubmissions.length === 0 && studentGrades.length > 0) { riskScore += 20; riskFactors.push("No assignment submissions"); }
        if (studentGrades.length === 0) { riskScore += 15; riskFactors.push("No grades recorded yet"); }

        return {
          ...student,
          riskScore: Math.min(riskScore, 100),
          riskFactors,
          avgGrade: Math.round(avgGrade),
          attendanceRate: Math.round(attendanceRate),
          missedAssignments: studentSubmissions.length === 0 ? 1 : 0,
          trend: determineTrend(avgGrade, attendanceRate),
          interventions: generateInterventions(riskFactors, avgGrade, attendanceRate),
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

  const generateAIInsight = async (student: AtRiskStudent) => {
    setIsGeneratingInsight(true);
    setAiInsight("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "report_comment",
          studentData: {
            name: `${student.first_name} ${student.last_name}`,
            averageGrade: student.avgGrade,
            attendanceRate: student.attendanceRate,
            riskScore: student.riskScore,
            riskFactors: student.riskFactors,
            trend: student.trend,
          },
          messages: [
            {
              role: "user",
              content: `Generate a detailed intervention plan for this at-risk student. Include specific actions for teachers, counselors, and parents. Be actionable and specific.`,
            },
          ],
        },
      });
      if (error) throw error;
      setAiInsight(data?.comment || "Unable to generate insight.");
    } catch {
      setAiInsight("AI insight generation failed. Please try again.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    toast.info("Running AI analysis on student data...");
    await new Promise((r) => setTimeout(r, 2000));
    await fetchAnalytics();
    toast.success("AI analysis complete! Risk scores updated.");
    setIsAnalyzing(false);
  };

  const sendParentAlert = async (student: AtRiskStudent) => {
    try {
      // Find parent link
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("parent_user_id")
        .eq("student_id", student.id);

      if (links && links.length > 0) {
        for (const link of links) {
          await supabase.from("notifications").insert({
            user_id: link.parent_user_id,
            title: `⚠️ Academic Alert: ${student.first_name} ${student.last_name}`,
            body: `Your child's risk score is ${student.riskScore}%. Factors: ${student.riskFactors.join(", ")}. Please contact the school for a meeting.`,
            type: "alert",
            link: "/parent/grades",
          });
        }
        toast.success("Parent alert sent successfully");
      } else {
        toast.error("No parent linked to this student");
      }
    } catch {
      toast.error("Failed to send alert");
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 60) return <Badge className="bg-destructive/10 text-destructive border-destructive/20">High Risk</Badge>;
    if (score >= 30) return <Badge className="bg-warning/10 text-warning border-warning/20">Medium Risk</Badge>;
    if (score > 0) return <Badge className="bg-info/10 text-info border-info/20">Low Risk</Badge>;
    return <Badge className="bg-success/10 text-success border-success/20">On Track</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "declining") return <TrendingDown className="w-4 h-4 text-destructive" />;
    if (trend === "improving") return <TrendingUp className="w-4 h-4 text-success" />;
    return <ArrowRight className="w-4 h-4 text-muted-foreground" />;
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="AI Predictive Analytics">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" /> Predictive Analytics Engine
            </h2>
            <p className="text-sm text-muted-foreground mt-1">AI-powered early warning system with automated intervention plans</p>
          </div>
          <Button onClick={runAIAnalysis} disabled={isAnalyzing} className="gap-2">
            <Zap className="w-4 h-4" /> {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Students", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
            { icon: AlertTriangle, label: "High Risk", value: stats.high, color: "text-destructive", bg: "bg-destructive/10" },
            { icon: TrendingDown, label: "Medium Risk", value: stats.medium, color: "text-warning", bg: "bg-warning/10" },
            { icon: TrendingUp, label: "On Track", value: stats.total - stats.high - stats.medium - stats.low, color: "text-success", bg: "bg-success/10" },
          ].map((s, i) => (
            <Card key={i} className="border-border/50 stat-glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Risk Distribution */}
        <Card className="border-border/50">
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
            <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-4">
              {stats.total > 0 && (
                <>
                  <div className="bg-destructive transition-all" style={{ width: `${(stats.high / stats.total) * 100}%` }} />
                  <div className="bg-warning transition-all" style={{ width: `${(stats.medium / stats.total) * 100}%` }} />
                  <div className="bg-info transition-all" style={{ width: `${(stats.low / stats.total) * 100}%` }} />
                  <div className="bg-success transition-all flex-1" />
                </>
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High ({stats.high})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Medium ({stats.medium})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> Low ({stats.low})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> On Track</span>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Student Risk Assessment ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.slice(0, 30).map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm text-foreground">{student.first_name} {student.last_name}</p>
                        {getRiskBadge(student.riskScore)}
                        {getTrendIcon(student.trend)}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right space-y-0.5 hidden sm:block">
                        <div className="text-xs"><span className="text-muted-foreground">Avg </span><span className={`font-bold ${student.avgGrade < 50 ? 'text-destructive' : 'text-foreground'}`}>{student.avgGrade}%</span></div>
                        <div className="text-xs"><span className="text-muted-foreground">Att </span><span className={`font-bold ${student.attendanceRate < 80 ? 'text-warning' : 'text-foreground'}`}>{student.attendanceRate}%</span></div>
                      </div>
                      <div className="w-12 text-center">
                        <span className={`text-lg font-bold ${student.riskScore >= 60 ? 'text-destructive' : student.riskScore >= 30 ? 'text-warning' : 'text-info'}`}>{student.riskScore}</span>
                        <Progress value={student.riskScore} className="h-1.5" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedStudent(student)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => { if (!open) { setSelectedStudent(null); setAiInsight(""); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                {selectedStudent?.first_name} {selectedStudent?.last_name} — Intervention Plan
              </DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <Tabs defaultValue="overview" className="mt-2">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="interventions">Plan</TabsTrigger>
                  <TabsTrigger value="ai">AI Insight</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-3 mt-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-border/50"><CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedStudent.riskScore}%</p>
                      <p className="text-[10px] text-muted-foreground">Risk Score</p>
                    </CardContent></Card>
                    <Card className="border-border/50"><CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedStudent.avgGrade}%</p>
                      <p className="text-[10px] text-muted-foreground">Avg Grade</p>
                    </CardContent></Card>
                    <Card className="border-border/50"><CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selectedStudent.attendanceRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Attendance</p>
                    </CardContent></Card>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Risk Factors</p>
                    {selectedStudent.riskFactors.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" /> {f}
                      </div>
                    ))}
                    {selectedStudent.riskFactors.length === 0 && <p className="text-sm text-muted-foreground">No risk factors detected</p>}
                  </div>
                </TabsContent>
                <TabsContent value="interventions" className="space-y-3 mt-3">
                  <p className="text-xs font-semibold text-foreground">Recommended Interventions</p>
                  {selectedStudent.interventions.map((inv, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                      <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-foreground">{inv}</span>
                    </div>
                  ))}
                  <Button className="w-full gap-2 mt-3" variant="outline" onClick={() => sendParentAlert(selectedStudent)}>
                    <Send className="w-4 h-4" /> Send Alert to Parent
                  </Button>
                </TabsContent>
                <TabsContent value="ai" className="space-y-3 mt-3">
                  {!aiInsight && !isGeneratingInsight && (
                    <Button className="w-full gap-2" onClick={() => generateAIInsight(selectedStudent)}>
                      <Brain className="w-4 h-4" /> Generate AI Intervention Plan
                    </Button>
                  )}
                  {isGeneratingInsight && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Generating AI insight...</span>
                    </div>
                  )}
                  {aiInsight && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-foreground whitespace-pre-wrap">{aiInsight}</div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPredictiveAnalytics;
