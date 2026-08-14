import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newProgName, setNewProgName] = useState("");
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [progDialogOpen, setProgDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: settingsData }, { data: subjectsData }, { data: progData }] = await Promise.all([
        supabase.from("school_settings").select("key, value"),
        supabase.from("subjects").select("*").order("name"),
        supabase.from("programmes").select("*").order("name"),
      ]);
      if (settingsData) {
        const map: Record<string, string> = {};
        settingsData.forEach((s: any) => { map[s.key] = s.value || ""; });
        setSettings(map);
      }
      setSubjects(subjectsData || []);
      setProgrammes(progData || []);
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from("school_settings")
          .upsert({ key, value, updated_by: user?.id }, { onConflict: "key" });
      }
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) { toast.error("Subject name required"); return; }
    const { error } = await supabase.from("subjects").insert({ name: newSubjectName, code: newSubjectCode || null });
    if (!error) {
      toast.success("Subject added");
      setNewSubjectName(""); setNewSubjectCode(""); setSubjectDialogOpen(false);
      const { data } = await supabase.from("subjects").select("*").order("name");
      setSubjects(data || []);
    } else { toast.error("Failed to add subject"); }
  };

  const handleDeleteSubject = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    setSubjects(subjects.filter(s => s.id !== id));
    toast.success("Subject removed");
  };

  const handleAddProgramme = async () => {
    if (!newProgName.trim()) { toast.error("Programme name required"); return; }
    const { error } = await supabase.from("programmes").insert({ name: newProgName });
    if (!error) {
      toast.success("Programme added");
      setNewProgName(""); setProgDialogOpen(false);
      const { data } = await supabase.from("programmes").select("*").order("name");
      setProgrammes(data || []);
    } else { toast.error("Failed to add programme"); }
  };

  const handleDeleteProgramme = async (id: string) => {
    await supabase.from("programmes").delete().eq("id", id);
    setProgrammes(programmes.filter(p => p.id !== id));
    toast.success("Programme removed");
  };

  const gradingScale = [
    { range: "80–100", grade: "A", remark: "Excellent" },
    { range: "75–79", grade: "A-", remark: "Excellent" },
    { range: "70–74", grade: "B+", remark: "Very Good" },
    { range: "65–69", grade: "B", remark: "Very Good" },
    { range: "60–64", grade: "B-", remark: "Very Good" },
    { range: "55–59", grade: "C+", remark: "Satisfactory" },
    { range: "50–54", grade: "C", remark: "Satisfactory" },
    { range: "45–49", grade: "C-", remark: "Satisfactory" },
    { range: "40–44", grade: "D", remark: "Pass" },
    { range: "0–39", grade: "F", remark: "Fail" },
  ];

  return (
    <AdminLayout title="School Settings">
      <div className="space-y-5 animate-fade-in max-w-4xl">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="registration" className="text-xs">Registration</TabsTrigger>
            <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
            <TabsTrigger value="subjects" className="text-xs">Subjects</TabsTrigger>
            <TabsTrigger value="programmes" className="text-xs">Programmes</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-xs">School Name</Label><Input value={settings.school_name || ""} onChange={(e) => updateSetting("school_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">School Email</Label><Input value={settings.school_email || ""} onChange={(e) => updateSetting("school_email", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">School Phone</Label><Input value={settings.school_phone || ""} onChange={(e) => updateSetting("school_phone", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">School Address</Label><Input value={settings.school_address || ""} onChange={(e) => updateSetting("school_address", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Current Session</Label><Input value={settings.current_session || ""} onChange={(e) => updateSetting("current_session", e.target.value)} className="mt-1" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Registration Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Auto-Approve New Registrations</p>
                    <p className="text-xs text-muted-foreground">When enabled, new users are approved immediately</p>
                  </div>
                  <Switch
                    checked={settings.auto_approve_registration === "true"}
                    onCheckedChange={(checked) => updateSetting("auto_approve_registration", checked ? "true" : "false")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Grading Scale</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">This grading scale is applied automatically when grades are entered.</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Score Range</TableHead>
                      <TableHead className="text-xs">Letter Grade</TableHead>
                      <TableHead className="text-xs">Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradingScale.map((g, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm font-mono">{g.range}</TableCell>
                        <TableCell><Badge variant="outline" className="font-bold">{g.grade}</Badge></TableCell>
                        <TableCell className="text-sm">{g.remark}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Subjects ({subjects.length})</CardTitle>
                <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Subject</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label className="text-xs">Subject Name</Label><Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Mathematics" /></div>
                      <div><Label className="text-xs">Subject Code (optional)</Label><Input value={newSubjectCode} onChange={(e) => setNewSubjectCode(e.target.value)} placeholder="e.g. MATH101" /></div>
                      <Button onClick={handleAddSubject} className="w-full">Add Subject</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Code</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell className="text-xs font-mono">{s.code || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSubject(s.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {subjects.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">No subjects defined yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programmes">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Programmes ({programmes.length})</CardTitle>
                <Dialog open={progDialogOpen} onOpenChange={setProgDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Programme</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Programme</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label className="text-xs">Programme Name</Label><Input value={newProgName} onChange={(e) => setNewProgName(e.target.value)} placeholder="e.g. Science" /></div>
                      <Button onClick={handleAddProgramme} className="w-full">Add Programme</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programmes.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteProgramme(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {programmes.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center py-6 text-muted-foreground text-sm">No programmes defined yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="bg-gradient-primary">
          <Save className="w-4 h-4 mr-2" /> Save All Settings
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
