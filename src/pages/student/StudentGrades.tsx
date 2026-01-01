import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const studentData = {
  name: "Binta Bah",
  id: "34482024",
  class: "Grade 10",
  programme: "Humanities Studies",
};

const gradesData = {
  currentTerm: {
    term: "2024/2025 Academic Year - Third Term",
    gpa: 2.55,
    subjects: [
      { subject: "Islamic Studies", ca: 29, exam: 57, total: 86, grade: "A", remark: "EXCELLENT" },
      { subject: "History", ca: 21, exam: 54, total: 75, grade: "A-", remark: "EXCELLENT" },
      { subject: "Government", ca: 20, exam: 52, total: 72, grade: "B+", remark: "VERY GOOD" },
      { subject: "Physical Health Education", ca: 22, exam: 50, total: 72, grade: "B+", remark: "VERY GOOD" },
      { subject: "Civic Education", ca: 14, exam: 54, total: 68, grade: "B+", remark: "VERY GOOD" },
      { subject: "Literature-in-English", ca: 24, exam: 39, total: 63, grade: "B", remark: "VERY GOOD" },
      { subject: "Science", ca: 18, exam: 42, total: 60, grade: "B", remark: "VERY GOOD" },
      { subject: "English Language", ca: 22, exam: 16, total: 38, grade: "F", remark: "FAIL" },
      { subject: "General Mathematics", ca: 17, exam: 11, total: 28, grade: "F", remark: "FAIL" },
    ],
  },
  previousTerms: [
    {
      term: "2024/2025 Academic Year - Second Term",
      gpa: 3.10,
      subjects: [
        { subject: "Islamic Studies", ca: 30, exam: 55, total: 85, grade: "A", remark: "EXCELLENT" },
        { subject: "History", ca: 25, exam: 50, total: 75, grade: "A-", remark: "EXCELLENT" },
        { subject: "Government", ca: 22, exam: 48, total: 70, grade: "B+", remark: "VERY GOOD" },
      ],
    },
    {
      term: "2024/2025 Academic Year - First Term",
      gpa: 3.52,
      subjects: [
        { subject: "Islamic Studies", ca: 28, exam: 60, total: 88, grade: "A", remark: "EXCELLENT" },
        { subject: "History", ca: 26, exam: 52, total: 78, grade: "A-", remark: "EXCELLENT" },
        { subject: "Government", ca: 24, exam: 50, total: 74, grade: "B+", remark: "VERY GOOD" },
      ],
    },
  ],
};

const StudentGrades = () => {
  return (
    <DashboardLayout
      userType="student"
      userName={studentData.name}
      userSubtitle={`ID: ${studentData.id}`}
      searchPlaceholder="Search subjects..."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            My Grades
          </h2>
          <p className="text-muted-foreground mt-1">
            {studentData.class} • {studentData.programme}
          </p>
        </div>

        {/* GPA Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up animation-delay-100">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Current Term GPA</p>
                  <p className="text-4xl font-bold mt-1">{gradesData.currentTerm.gpa.toFixed(2)}</p>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-50">trending_up</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                  <p className="text-4xl font-bold text-foreground mt-1">3.06</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-success">analytics</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Class Rank</p>
                  <p className="text-4xl font-bold text-foreground mt-1">12<span className="text-lg text-muted-foreground">/44</span></p>
                </div>
                <span className="material-symbols-outlined text-4xl text-warning">emoji_events</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grades Tables */}
        <Tabs defaultValue="current" className="animate-fade-up animation-delay-200">
          <TabsList>
            <TabsTrigger value="current">Current Term</TabsTrigger>
            <TabsTrigger value="previous">Previous Terms</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">assignment</span>
                  {gradesData.currentTerm.term}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Subject</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">CA (30%)</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Exam (70%)</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Grade</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradesData.currentTerm.subjects.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                            row.grade === "F" ? "bg-destructive/5" : ""
                          }`}
                        >
                          <td className="py-4 px-4 font-medium text-foreground">{row.subject}</td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.ca}</td>
                          <td className="py-4 px-4 text-center text-muted-foreground">{row.exam}</td>
                          <td className="py-4 px-4 text-center font-semibold text-foreground">{row.total}</td>
                          <td className="py-4 px-4 text-center">
                            <GradeBadge grade={row.grade} size="md" />
                          </td>
                          <td className={`py-4 px-4 text-sm ${
                            row.grade === "F" ? "text-destructive font-medium" : "text-muted-foreground"
                          }`}>
                            {row.remark}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GPA Summary at bottom */}
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calculate</span>
                    <span className="font-medium text-foreground">Term Grade Point Average (GPA)</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{gradesData.currentTerm.gpa.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="previous" className="mt-6 space-y-6">
            {gradesData.previousTerms.map((term, termIdx) => (
              <Card key={termIdx}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-muted-foreground">history</span>
                      {term.term}
                    </span>
                    <span className="text-primary font-bold">GPA: {term.gpa.toFixed(2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Subject</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">CA</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Exam</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Total</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {term.subjects.map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground">{row.subject}</td>
                            <td className="py-3 px-4 text-center text-muted-foreground">{row.ca}</td>
                            <td className="py-3 px-4 text-center text-muted-foreground">{row.exam}</td>
                            <td className="py-3 px-4 text-center font-semibold text-foreground">{row.total}</td>
                            <td className="py-3 px-4 text-center">
                              <GradeBadge grade={row.grade} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentGrades;
