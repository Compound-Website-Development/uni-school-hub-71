import { useState, useEffect } from "react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Save, User, Mail, Phone, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";

const StaffProfile = () => {
  const { teacherData, user, userRole } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (teacherData) {
      setForm({
        first_name: teacherData.first_name || "",
        last_name: teacherData.last_name || "",
        email: user?.email || "",
        phone: "",
        department: teacherData.department || "",
      });
      // Fetch full teacher record for phone
      const fetchFull = async () => {
        const { data } = await supabase
          .from("teachers")
          .select("phone")
          .eq("id", teacherData.id)
          .maybeSingle();
        if (data) setForm(prev => ({ ...prev, phone: data.phone || "" }));
      };
      fetchFull();
    }
  }, [teacherData, user]);

  const handleSave = async () => {
    if (!teacherData) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          department: form.department,
        })
        .eq("id", teacherData.id);
      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = teacherData
    ? `${teacherData.first_name?.[0] || ""}${teacherData.last_name?.[0] || ""}`
    : "ST";

  return (
    <StaffLayout title="My Profile">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        {/* Profile Header */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {teacherData?.first_name} {teacherData?.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="capitalize">{userRole || "Staff"}</Badge>
                  <Badge variant="outline" className="text-xs">{teacherData?.employee_id}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
              <Input value={form.email} disabled className="mt-1 bg-muted/30" />
              <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+234..." />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Briefcase className="w-3 h-3" /> Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1" placeholder="e.g. Mathematics" />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary">
              <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="rounded-xl border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="font-medium font-mono">{teacherData?.employee_id || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{userRole || "Staff"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
};

export default StaffProfile;
