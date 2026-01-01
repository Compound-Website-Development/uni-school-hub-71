import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const adminData = {
  name: "Admin User",
  role: "Administrator",
};

const pendingApplications = [
  {
    id: "APP-2026-001",
    name: "Fatou Ceesay",
    email: "fatou.ceesay@email.com",
    phone: "+220 7654321",
    grade: "Grade 10",
    programme: "Sciences",
    previousSchool: "Brikama Lower Basic",
    appliedDate: "2025-12-28",
    status: "pending",
  },
  {
    id: "APP-2026-002",
    name: "Modou Jobe",
    email: "modou.jobe@email.com",
    phone: "+220 1234567",
    grade: "Grade 11",
    programme: "Humanities",
    previousSchool: "Banjul Senior Secondary",
    appliedDate: "2025-12-27",
    status: "pending",
  },
  {
    id: "APP-2026-003",
    name: "Aminata Touray",
    email: "aminata.t@email.com",
    phone: "+220 9876543",
    grade: "Grade 10",
    programme: "Commerce",
    previousSchool: "Serrekunda Basic",
    appliedDate: "2025-12-26",
    status: "pending",
  },
];

const processedApplications = [
  {
    id: "APP-2025-098",
    name: "Omar Sillah",
    grade: "Grade 10",
    programme: "Sciences",
    processedDate: "2025-12-20",
    status: "accepted",
    studentId: "20260001",
  },
  {
    id: "APP-2025-097",
    name: "Isatou Darboe",
    grade: "Grade 11",
    programme: "Humanities",
    processedDate: "2025-12-19",
    status: "accepted",
    studentId: "20260002",
  },
  {
    id: "APP-2025-096",
    name: "Lamin Camara",
    grade: "Grade 10",
    programme: "Arts",
    processedDate: "2025-12-18",
    status: "rejected",
    reason: "Incomplete documents",
  },
];

const StaffAdmissions = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<typeof pendingApplications[0] | null>(null);

  const handleAccept = (application: typeof pendingApplications[0]) => {
    const newStudentId = `2026${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    toast({
      title: "Application Accepted!",
      description: `${application.name} has been admitted. Student ID: ${newStudentId}`,
    });
  };

  const handleReject = (application: typeof pendingApplications[0]) => {
    toast({
      title: "Application Rejected",
      description: `${application.name}'s application has been rejected.`,
      variant: "destructive",
    });
  };

  const filteredPending = pendingApplications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      userType="admin"
      userName={adminData.name}
      userSubtitle={adminData.role}
      searchPlaceholder="Search applications..."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Admissions Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Review and process student applications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-lg py-2 px-4">
              <span className="material-symbols-outlined mr-2 text-warning">pending</span>
              {pendingApplications.length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-up animation-delay-100">
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <span className="material-symbols-outlined text-warning text-2xl">pending</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingApplications.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <span className="material-symbols-outlined text-success text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {processedApplications.filter(a => a.status === "accepted").length}
                </p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <span className="material-symbols-outlined text-destructive text-2xl">cancel</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {processedApplications.filter(a => a.status === "rejected").length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="animate-fade-up animation-delay-200">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">pending</span>
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="processed" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">done_all</span>
              Processed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground material-symbols-outlined">search</span>
              <Input
                placeholder="Search by name or application ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredPending.map((app) => (
                <Card key={app.id} className="card-hover-subtle">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{app.name}</h3>
                            <p className="text-sm text-muted-foreground">{app.id}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Applying For</p>
                            <p className="text-sm font-medium text-foreground">{app.grade}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Programme</p>
                            <p className="text-sm font-medium text-foreground">{app.programme}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Previous School</p>
                            <p className="text-sm font-medium text-foreground">{app.previousSchool}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Applied</p>
                            <p className="text-sm font-medium text-foreground">{app.appliedDate}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <span className="material-symbols-outlined mr-1 text-sm">visibility</span>
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleReject(app)}
                        >
                          <span className="material-symbols-outlined mr-1 text-sm">close</span>
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          onClick={() => handleAccept(app)}
                        >
                          <span className="material-symbols-outlined mr-1 text-sm">check</span>
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="processed" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Application ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Grade</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Processed Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Student ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedApplications.map((app) => (
                      <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{app.id}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{app.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{app.grade}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{app.processedDate}</td>
                        <td className="py-3 px-4">
                          <Badge variant={app.status === "accepted" ? "default" : "destructive"}>
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">
                          {app.status === "accepted" ? app.studentId : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffAdmissions;
