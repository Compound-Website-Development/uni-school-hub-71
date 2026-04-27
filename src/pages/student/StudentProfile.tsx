import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { ProfileHero, InfoSection, InfoRow } from "@/components/profile/ProfileShared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Heart, BookOpen, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

const StudentProfile = () => {
  const { studentData, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (studentData?.id) {
      supabase.from("students").select("*").eq("id", studentData.id).maybeSingle()
        .then(({ data }) => { if (data) setForm(data); });
    }
  }, [studentData?.id]);

  const save = async () => {
    if (!studentData?.id) return;
    setSaving(true);
    const { error } = await supabase.from("students").update({
      phone: form.phone, address: form.address, bio: form.bio, hobbies: form.hobbies,
      blood_group: form.blood_group, emergency_contact: form.emergency_contact,
    }).eq("id", studentData.id);
    setSaving(false);
    if (error) toast.error("Couldn't save"); else { toast.success("Profile updated"); setEditing(false); }
  };

  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "S";

  return (
    <StudentLayout title="My Profile">
      <div className="space-y-6 pb-8">
        <ProfileHero
          name={`${form.first_name || ""} ${form.last_name || ""}`.trim() || "Student"}
          subtitle={user?.email || ""}
          initials={initials}
          badges={[
            { label: "Student" },
            { label: form.student_id || "—", variant: "outline" },
            ...(form.status ? [{ label: form.status, variant: "secondary" as const }] : []),
          ]}
        />

        <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          <InfoSection title="About Me" icon={Sparkles}>
            {editing ? (
              <Textarea value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell us about yourself…" />
            ) : (
              <p className="text-sm text-muted-foreground italic">{form.bio || "Add a short bio to introduce yourself."}</p>
            )}
          </InfoSection>

          <InfoSection title="Personal Info" icon={User}>
            <InfoRow label="Date of Birth" value={form.date_of_birth} />
            <InfoRow label="Gender" value={form.gender} />
            <InfoRow label="Nationality" value={form.nationality} />
            <InfoRow label="State of Origin" value={form.state_of_origin} />
            <InfoRow label="Religion" value={form.religion} />
            <InfoRow label="Blood Group" value={form.blood_group} />
          </InfoSection>

          <InfoSection title="Contact" icon={Phone}>
            {editing ? (
              <>
                <div><Label className="text-xs">Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-xs">Address</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div><Label className="text-xs">Emergency Contact</Label><Input value={form.emergency_contact || ""} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
              </>
            ) : (
              <>
                <InfoRow label="Phone" value={form.phone} />
                <InfoRow label="Address" value={form.address} />
                <InfoRow label="Emergency" value={form.emergency_contact} />
              </>
            )}
          </InfoSection>

          <InfoSection title="Guardian" icon={Heart}>
            <InfoRow label="Name" value={form.guardian_name} />
            <InfoRow label="Phone" value={form.guardian_phone} />
          </InfoSection>

          <InfoSection title="Interests & Hobbies" icon={BookOpen}>
            {editing ? (
              <Input value={form.hobbies || ""} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} placeholder="Football, Reading, Coding…" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(form.hobbies || "").split(",").map((h: string, i: number) => h.trim() && (
                  <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{h.trim()}</span>
                ))}
                {!form.hobbies && <p className="text-sm text-muted-foreground italic">No hobbies added yet.</p>}
              </div>
            )}
          </InfoSection>

          <div className="lg:col-span-2 flex justify-end gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving} className="shadow-md hover:shadow-lg">
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} className="shadow-md hover:shadow-lg">Edit Profile</Button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
