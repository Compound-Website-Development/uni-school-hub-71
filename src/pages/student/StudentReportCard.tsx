import { Link } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { SCHOOL } from "@/lib/schoolConfig";
import CanonicalReportCard from "@/components/reports/CanonicalReportCard";
import { ArrowLeft, ShieldCheck } from "lucide-react";

/**
 * Pupils see exactly the sheet the Staff Portal builder produced — the canonical
 * report card, read-only, straight from the database. No second implementation.
 */
const StudentReportCard = () => {
  const { studentData } = useAuth();
  const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student";

  return (
    <StudentLayout title="Report Card">
      <div className="space-y-5 animate-fade-in mx-auto w-full max-w-4xl">
        <Link to="/student/grades" className="flex items-center gap-2 text-sm text-primary font-semibold press print:hidden">
          <ArrowLeft className="w-4 h-4" /> My Results
        </Link>

        <Card className="rounded-3xl shadow-elev-2 border-border/60 overflow-hidden print:hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
          <CardContent className="p-5 flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">OFFICIAL REPORT CARD</h1>
              <p className="text-sm text-muted-foreground">{SCHOOL.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {studentName}{studentData?.student_id ? ` • ${studentData.student_id}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">School issued</Badge>
          </CardContent>
        </Card>

        <CanonicalReportCard studentId={studentData?.id} requirePublished />
      </div>
    </StudentLayout>
  );
};

export default StudentReportCard;
