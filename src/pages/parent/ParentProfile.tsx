import { useState, useEffect } from "react";
import { ParentLayout } from "@/components/layout/ParentLayout";
import { ProfileHero, InfoSection, InfoRow } from "@/components/profile/ProfileShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Users, Phone, Save, Sparkles, Calculator } from "lucide-react";
import { toast } from "sonner";

const ParentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({ first_name: "", last_name: "", phone: "", bio: "" });
  const [children, setChildren] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [featureSettings, setFeatureSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data); });
    supabase.from("parent_student_links").select("student_id").eq("parent_user_id", user.id)
      .then(async ({ data }) => {
        if (data?.length) {
          const ids = data.map(l => l.student_id);
          const { data: kids } = await supabase.from("students").select("id, first_name, last_name, student_id, class_id").in("id", ids);
          setChildren(kids || []);
          const { data: settings } = await (supabase as any).from("student_feature_settings").select("student_id, ai_tutor_enabled, calculator_enabled").in("student_id", ids);
          const mapped: Record<string, any> = {};
          (settings || []).forEach((s: any) => { mapped[s.student_id] = s; });
          setFeatureSettings(mapped);
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id, first_name: profile.first_name, last_name: profile.last_name,
      email: user.email, phone: profile.phone, bio: profile.bio,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Couldn't save"); else { toast.success("Profile updated"); setEditing(false); }
  };

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "P";

  return (
    <ParentLayout title="My Profile">
      <div className="space-y-6 pb-8">
        <ProfileHero
          name={`${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Parent"}
          subtitle={user?.email || ""}
          initials={initials}
          badges={[{ label: "Parent" }, { label: `${children.length} ${children.length === 1 ? "child" : "children"}`, variant: "outline" }]}
        />
        <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          <InfoSection title="Personal" icon={User}>
            {editing ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">First Name</Label><Input value={profile.first_name || ""} onChange={e => setProfile({ ...profile, first_name: e.target.value })} /></div>
                  <div><Label className="text-xs">Last Name</Label><Input value={profile.last_name || ""} onChange={e => setProfile({ ...profile, last_name: e.target.value })} /></div>
                </div>
                <div><Label className="text-xs">Phone</Label><Input value={profile.phone || ""} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
              </>
            ) : (
              <>
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Phone" value={profile.phone} />
              </>
            )}
          </InfoSection>

          <InfoSection title="My Children" icon={Users}>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No children linked. Contact the school office to link your child's account.</p>
            ) : children.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="font-medium text-sm">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.student_id}</p>
                </div>
              </div>
            ))}
          </InfoSection>

          <InfoSection title="Learning controls" icon={Sparkles}>
            <p className="mb-3 text-xs text-muted-foreground">Control the AI tutor and calculator for each linked child.</p>
            {children.map(c => {
              const s = featureSettings[c.id] || { ai_tutor_enabled: true, calculator_enabled: true };
              const toggle = async (field: "ai_tutor_enabled" | "calculator_enabled") => {
                const next = !s[field];
                const { error } = await (supabase as any).from("student_feature_settings").update({ [field]: next, updated_by: user?.id }).eq("student_id", c.id);
                if (error) toast.error("Could not update setting");
                else setFeatureSettings(prev => ({ ...prev, [c.id]: { ...s, [field]: next } }));
              };
              return <div key={c.id} className="border-b border-border/30 py-3 last:border-0">
                <p className="mb-2 text-sm font-semibold">{c.first_name} {c.last_name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant={s.ai_tutor_enabled ? "default" : "outline"} onClick={() => toggle("ai_tutor_enabled")}><Sparkles className="mr-2 h-4 w-4" />AI {s.ai_tutor_enabled ? "On" : "Off"}</Button>
                  <Button size="sm" variant={s.calculator_enabled ? "default" : "outline"} onClick={() => toggle("calculator_enabled")}><Calculator className="mr-2 h-4 w-4" />Calculator {s.calculator_enabled ? "On" : "Off"}</Button>
                </div>
              </div>;
            })}
          </InfoSection>

          <div className="lg:col-span-2 flex justify-end gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving} className="shadow-md hover:shadow-lg"><Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save"}</Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} className="shadow-md hover:shadow-lg">Edit Profile</Button>
            )}
          </div>
        </div>
      </div>
    </ParentLayout>
  );
};

export default ParentProfile;
