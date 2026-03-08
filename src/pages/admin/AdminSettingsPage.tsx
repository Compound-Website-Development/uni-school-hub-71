import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("school_settings").select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: any) => { map[s.key] = s.value || ""; });
        setSettings(map);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
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
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <AdminLayout title="School Settings">
      <div className="space-y-5 animate-fade-in max-w-3xl">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="registration" className="text-xs">Registration</TabsTrigger>
            <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">School Name</Label>
                  <Input value={settings.school_name || ""} onChange={(e) => updateSetting("school_name", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Email</Label>
                  <Input value={settings.school_email || ""} onChange={(e) => updateSetting("school_email", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Phone</Label>
                  <Input value={settings.school_phone || ""} onChange={(e) => updateSetting("school_phone", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">School Address</Label>
                  <Input value={settings.school_address || ""} onChange={(e) => updateSetting("school_address", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Current Session</Label>
                  <Input value={settings.current_session || ""} onChange={(e) => updateSetting("current_session", e.target.value)} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Registration Settings</CardTitle>
              </CardHeader>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Academic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Grading Scale</Label>
                  <Input value={settings.grading_scale || "standard"} onChange={(e) => updateSetting("grading_scale", e.target.value)} className="mt-1" />
                  <p className="text-[10px] text-muted-foreground mt-1">Standard: A (80-100), B (70-79), C (60-69), D (50-59), F (0-49)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} className="bg-primary">
          <Save className="w-4 h-4 mr-2" /> Save All Settings
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
