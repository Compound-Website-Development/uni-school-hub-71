import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { SCHOOL } from "@/lib/schoolConfig";
import npsLogo from "@/assets/logo";
import { User, ShieldCheck } from "lucide-react";

interface Profile {
  full_name: string;
  admission_no: string;
  class_name: string | null;
  photo_url: string | null;
  status: string | null;
  attendance_present: number;
  attendance_total: number;
}

interface Result {
  subject: string | null;
  term: string | null;
  total_score: number | null;
  letter_grade: string | null;
  remark: string | null;
}

const PublicStudentProfile = () => {
  const { token } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.rpc("public_student_profile", { _token: token }),
        supabase.rpc("public_student_results", { _token: token }),
      ]);
      setProfile((p as Profile[])?.[0] ?? null);
      setResults((r as Result[]) ?? []);
      setLoading(false);
    })();
  }, [token]);

  const rate =
    profile && profile.attendance_total > 0
      ? Math.round((profile.attendance_present / profile.attendance_total) * 100)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft to-background p-4">
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <div className="flex items-center gap-3">
          <img src={npsLogo} alt={`${SCHOOL.name} logo`} className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-foreground">{SCHOOL.name}</h1>
            <p className="text-xs text-muted-foreground">{SCHOOL.motto}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-40 skeleton rounded-xl" />
        ) : !profile ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              This ID card could not be verified.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-5 flex gap-4 items-center">
                <div className="w-24 h-28 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {profile.photo_url && /^https?:\/\//.test(profile.photo_url) ? (
                    <img src={profile.photo_url} alt={`Photograph of ${profile.full_name}`} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/40" />
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{profile.full_name}</h2>
                  <p className="text-sm text-muted-foreground font-mono">{profile.admission_no}</p>
                  <p className="text-sm text-foreground">{profile.class_name || "Unassigned class"}</p>
                  <Badge variant={profile.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {profile.status || "active"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Attendance</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {rate === null ? (
                  "No attendance recorded yet."
                ) : (
                  <>
                    Present <span className="font-semibold text-foreground">{profile.attendance_present}</span> of{" "}
                    <span className="font-semibold text-foreground">{profile.attendance_total}</span> days ({rate}%).
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Published results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {results.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-6 pb-6">No results have been published yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Term</TableHead>
                        <TableHead className="text-xs">Score</TableHead>
                        <TableHead className="text-xs">Grade</TableHead>
                        <TableHead className="text-xs">Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.subject || "—"}</TableCell>
                          <TableCell className="text-xs">{r.term || "—"}</TableCell>
                          <TableCell className="text-sm">{r.total_score ?? "—"}</TableCell>
                          <TableCell className="text-sm font-semibold">{r.letter_grade || "—"}</TableCell>
                          <TableCell className="text-xs">{r.remark || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <p className="text-[11px] text-center text-muted-foreground">
              Verified digital profile. Contact details are not shown publicly.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicStudentProfile;
