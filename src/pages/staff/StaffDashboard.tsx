import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const teacherData = {
  name: "Mr. Amadou Jallow",
  department: "Mathematics Dept.",
};

const stats = [
  { icon: "group", label: "Total Students", value: "245", variant: "primary" as const },
  { icon: "book", label: "Classes", value: "6", variant: "success" as const },
  { icon: "assignment", label: "Pending Grades", value: "12", variant: "warning" as const },
  { icon: "person_add", label: "New Applications", value: "8", variant: "destructive" as const },
];

const recentActivity = [
  { action: "Uploaded grades for", target: "Grade 10A - Mathematics", time: "2 hours ago", icon: "upload" },
  { action: "Approved application for", target: "Fatou Ceesay", time: "5 hours ago", icon: "check_circle" },
  { action: "Generated report for", target: "Grade 11B - Term 3", time: "Yesterday", icon: "description" },
  { action: "Updated attendance for", target: "Grade 12A", time: "Yesterday", icon: "fact_check" },
];

const upcomingClasses = [
  { time: "09:00 AM", class: "Grade 10A", subject: "Mathematics", students: 32 },
  { time: "11:00 AM", class: "Grade 11B", subject: "Mathematics", students: 28 },
  { time: "02:00 PM", class: "Grade 12A", subject: "Additional Math", students: 24 },
];

const pendingTasks = [
  { task: "Upload Term 3 grades for Grade 10A", due: "Due in 2 days", priority: "high" },
  { task: "Review 8 new admission applications", due: "Due in 5 days", priority: "medium" },
  { task: "Generate class reports", due: "Due in 7 days", priority: "low" },
];

const StaffDashboard = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardLayout
      userType="admin"
      userName={teacherData.name}
      userSubtitle={teacherData.department}
      searchPlaceholder="Search students, classes, or documents..."
      notifications={5}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Good Morning, {teacherData.name.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{currentDate}</span> • You have 3 classes today
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/staff/gradebook">
              <Button className="bg-gradient-primary">
                <span className="material-symbols-outlined mr-2">edit_note</span>
                Upload Grades
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up animation-delay-100">
          {stats.map((stat, idx) => (
            <StatCard key={idx} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animation-delay-200">
          {[
            { icon: "edit_note", label: "Upload Grades", href: "/staff/gradebook", color: "bg-primary" },
            { icon: "person_add", label: "Admissions", href: "/staff/admissions", color: "bg-success" },
            { icon: "group", label: "Students", href: "/staff/students", color: "bg-warning" },
            { icon: "analytics", label: "Reports", href: "/staff/reports", color: "bg-info" },
          ].map((action, idx) => (
            <Link key={idx} to={action.href}>
              <Card className="p-4 card-hover-subtle cursor-pointer group">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-lg ${action.color}/10 group-hover:${action.color} transition-colors`}>
                    <span className={`material-symbols-outlined ${action.color.replace('bg-', 'text-')} group-hover:text-primary-foreground text-2xl`}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 animate-fade-up animation-delay-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Today's Classes
              </CardTitle>
              <Button variant="ghost" size="sm">View Schedule</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      idx === 0 
                        ? "bg-primary/5 border-primary/20" 
                        : "bg-secondary/50 border-border hover:bg-secondary"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-xs font-medium">{cls.time.split(" ")[0]}</span>
                      <span className="text-xs opacity-70">{cls.time.split(" ")[1]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{cls.class} - {cls.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {cls.students} students
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <span className="material-symbols-outlined mr-1 text-sm">visibility</span>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="animate-fade-up animation-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">pending_actions</span>
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.priority === "high" ? "bg-destructive" :
                      item.priority === "medium" ? "bg-warning" : "bg-success"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground">{item.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="animate-fade-up animation-delay-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-muted-foreground">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      {item.action} <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
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

export default StaffDashboard;
