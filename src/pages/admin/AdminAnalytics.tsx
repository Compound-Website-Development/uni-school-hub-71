import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { Users, GraduationCap, TrendingUp, CreditCard } from "lucide-react";

const COLORS = ["hsl(168, 55%, 38%)", "hsl(24, 90%, 55%)", "hsl(210, 75%, 55%)", "hsl(0, 70%, 55%)", "hsl(260, 55%, 60%)"];

const AdminAnalytics = () => {
  const [studentsByClass, setStudentsByClass] = useState<any[]>([]);
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Students by class
        const { data: classData } = await supabase
          .from("classes")
          .select("name, students(id)");
        
        if (classData) {
          setStudentsByClass(classData.map((c: any) => ({
            name: c.name,
            students: c.students?.length || 0
          })).filter((c: any) => c.students > 0).slice(0, 10));
        }

        // Grade distribution
        const { data: grades } = await supabase
          .from("grades")
          .select("letter_grade")
          .not("letter_grade", "is", null);

        if (grades) {
          const dist: Record<string, number> = {};
          grades.forEach((g: any) => { dist[g.letter_grade] = (dist[g.letter_grade] || 0) + 1; });
          setGradeDistribution(Object.entries(dist).map(([grade, count]) => ({ name: grade, value: count })));
        }

        // Mock enrollment trend (we'd need historical data)
        setEnrollmentTrend([
          { month: "Jan", students: 120 },
          { month: "Feb", students: 135 },
          { month: "Mar", students: 142 },
          { month: "Apr", students: 150 },
          { month: "May", students: 158 },
          { month: "Jun", students: 165 },
        ]);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6 animate-fade-in">
        <p className="text-sm text-muted-foreground">School-wide performance metrics and trends.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Enrollment Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Student Enrollment Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={enrollmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="hsl(168, 55%, 38%)" strokeWidth={2} dot={{ fill: "hsl(168, 55%, 38%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Students by Class */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-info" />
                Students per Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsByClass.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={studentsByClass}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="students" fill="hsl(168, 55%, 38%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No class data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accent" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={gradeDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {gradeDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No grade data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Fee Collection (placeholder) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-success" />
                Fee Collection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[{ name: "Paid", value: 65 }, { name: "Outstanding", value: 35 }]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    <Cell fill="hsl(152, 60%, 42%)" />
                    <Cell fill="hsl(0, 70%, 55%)" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
