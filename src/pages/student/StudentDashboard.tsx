import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge } from "@/components/ui/grade-badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Demo student data
const studentData = {
  name: "Binta Bah",
  id: "34482024",
  class: "Grade 10",
  programme: "Humanities Studies",
  gpa: 2.55,
  cgpa: 3.06,
  position: "12th out of 44",
};

const recentGrades = [
  { subject: "Islamic Studies", grade: "A", score: 86 },
  { subject: "History", grade: "A-", score: 75 },
  { subject: "Government", grade: "B+", score: 72 },
  { subject: "Physical Health Ed.", grade: "B+", score: 72 },
  { subject: "Civic Education", grade: "B+", score: 68 },
];

const upcomingClasses = [
  { time: "08:00 AM", subject: "English Language", room: "Room 101", teacher: "Mr. Jallow" },
  { time: "10:00 AM", subject: "Mathematics", room: "Room 204", teacher: "Mrs. Ceesay" },
  { time: "12:00 PM", subject: "History", room: "Room 108", teacher: "Mr. Camara" },
  { time: "02:00 PM", subject: "Islamic Studies", room: "Room 112", teacher: "Sheikh Fatty" },
];

const StudentDashboard = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <DashboardLayout
      userType="student"
      userName={studentData.name}
      userSubtitle={`ID: ${studentData.id}`}
      searchPlaceholder="Search classes, grades, or teachers..."
      notifications={2}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Good Morning, {studentData.name.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{currentDate}</span> • {studentData.class} - {studentData.programme}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/student/reports">
              <Button variant="outline" size="sm">
                <span className="material-symbols-outlined mr-2 text-lg">download</span>
                Download Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up animation-delay-100">
          <StatCard
            icon="trending_up"
            label="Current GPA"
            value={studentData.gpa.toFixed(2)}
            variant="primary"
          />
          <StatCard
            icon="analytics"
            label="Cumulative GPA"
            value={studentData.cgpa.toFixed(2)}
            variant="success"
          />
          <StatCard
            icon="emoji_events"
            label="Class Position"
            value={studentData.position}
            variant="warning"
          />
          <StatCard
            icon="calendar_today"
            label="Current Term"
            value="Term 3"
            variant="default"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 animate-fade-up animation-delay-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Today's Schedule
              </CardTitle>
              <Link to="/student/schedule">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
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
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="material-symbols-outlined">
                        {idx === 0 ? "play_circle" : "schedule"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{cls.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls.room} • {cls.teacher}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${idx === 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {cls.time}
                      </p>
                      {idx === 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Grades */}
          <Card className="animate-fade-up animation-delay-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">grade</span>
                Recent Grades
              </CardTitle>
              <Link to="/student/grades">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGrades.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.subject}</p>
                      <p className="text-xs text-muted-foreground">{item.score}%</p>
                    </div>
                    <GradeBadge grade={item.grade} size="sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animation-delay-400">
          {[
            { icon: "grade", label: "View Grades", href: "/student/grades", color: "primary" },
            { icon: "description", label: "Download Report", href: "/student/reports", color: "success" },
            { icon: "calendar_today", label: "Schedule", href: "/student/schedule", color: "warning" },
            { icon: "chat", label: "Messages", href: "/student/messages", color: "info" },
          ].map((action, idx) => (
            <Link key={idx} to={action.href}>
              <Card className="p-4 card-hover-subtle cursor-pointer group">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className={`p-3 rounded-lg bg-${action.color}/10 group-hover:bg-${action.color} transition-colors`}>
                    <span className={`material-symbols-outlined text-${action.color} group-hover:text-${action.color}-foreground text-2xl`}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
