import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAuth } from "@/hooks/useAuth";
import CanonicalReportCard from "@/components/reports/CanonicalReportCard";
import { loadReportContext, StudentOption } from "@/lib/reportCards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const StudentReports = () => {
  const { studentData, userRole } = useAuth();
  const isStaffPreview = !studentData && (userRole === "admin" || userRole === "teacher");

  const [pupils, setPupils] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!isStaffPreview) return;
    let cancelled = false;
    loadReportContext().then(({ students }) => {
      if (cancelled) return;
      setPupils(students);
      setSelected((prev) => prev || students[0]?.id || "");
    });
    return () => { cancelled = true; };
  }, [isStaffPreview]);

  const activeId = studentData?.id ?? (isStaffPreview ? selected : null);

  return (
    <StudentLayout title="Reports">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <div className="print:hidden">
          <h1 className="text-2xl font-bold text-foreground">Term Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The official report card issued by your school — the same sheet built in the Staff Portal.
          </p>
        </div>

        {isStaffPreview && (
          <div className="print:hidden space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Staff preview — choose a pupil
            </p>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="Select a pupil" />
              </SelectTrigger>
              <SelectContent>
                {pupils.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} — {p.student_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <CanonicalReportCard studentId={activeId} requirePublished={!isStaffPreview} />
      </div>
    </StudentLayout>
  );
};

export default StudentReports;
