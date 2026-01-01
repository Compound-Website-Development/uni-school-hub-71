import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

const adminData = {
  name: "Mr. Amadou Jallow",
  role: "Administrator",
};

const students = [
  { id: "34482024", name: "Binta Bah", class: "Grade 10A", programme: "Humanities", gpa: 2.55, status: "active" },
  { id: "34482025", name: "Omar Ceesay", class: "Grade 10A", programme: "Sciences", gpa: 3.42, status: "active" },
  { id: "34482026", name: "Fatou Jallow", class: "Grade 10B", programme: "Commerce", gpa: 3.15, status: "active" },
  { id: "34482027", name: "Amadou Sowe", class: "Grade 11A", programme: "Sciences", gpa: 2.89, status: "active" },
  { id: "34482028", name: "Mariama Fatty", class: "Grade 11B", programme: "Humanities", gpa: 3.78, status: "active" },
  { id: "34482029", name: "Lamin Touray", class: "Grade 12A", programme: "Sciences", gpa: 3.21, status: "active" },
  { id: "34482030", name: "Isatou Njie", class: "Grade 12A", programme: "Commerce", gpa: 2.67, status: "inactive" },
  { id: "34482031", name: "Ebrima Camara", class: "Grade 10A", programme: "Humanities", gpa: 3.56, status: "active" },
];

const StaffStudents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [programmeFilter, setProgrammeFilter] = useState("all");

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.includes(searchQuery);
    const matchesClass = classFilter === "all" || student.class === classFilter;
    const matchesProgramme = programmeFilter === "all" || student.programme === programmeFilter;
    return matchesSearch && matchesClass && matchesProgramme;
  });

  const classes = [...new Set(students.map(s => s.class))];
  const programmes = [...new Set(students.map(s => s.programme))];

  return (
    <DashboardLayout
      userType="admin"
      userName={adminData.name}
      userSubtitle={adminData.role}
      searchPlaceholder="Search students..."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Students
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage and view all enrolled students
            </p>
          </div>
          <Badge variant="secondary" className="text-lg py-2 px-4">
            <span className="material-symbols-outlined mr-2">groups</span>
            {students.length} Students
          </Badge>
        </div>

        {/* Filters */}
        <Card className="animate-fade-up animation-delay-100">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined">search</span>
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Programmes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programmes</SelectItem>
                    {programmes.map(prog => (
                      <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="animate-fade-up animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Student Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Programme</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">GPA</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{student.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{student.class}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{student.programme}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${
                          student.gpa >= 3.5 ? "text-success" :
                          student.gpa >= 2.5 ? "text-primary" :
                          "text-warning"
                        }`}>
                          {student.gpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
                <p>No students found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animation-delay-300">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{students.filter(s => s.class.includes("10")).length}</p>
              <p className="text-sm text-muted-foreground">Grade 10</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{students.filter(s => s.class.includes("11")).length}</p>
              <p className="text-sm text-muted-foreground">Grade 11</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{students.filter(s => s.class.includes("12")).length}</p>
              <p className="text-sm text-muted-foreground">Grade 12</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{students.filter(s => s.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffStudents;
