import { StaffLayout } from "@/components/layout/StaffLayout";
import ReportCardWorkspace from "@/components/reports/ReportCardWorkspace";
import SchoolInfoPanel from "@/components/SchoolInfoPanel";

const StaffReportCard = () => (
  <StaffLayout title="Report Card Builder">
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Report Card Builder</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pick a pupil and term, fill in the scores — totals, remarks and percentage are calculated
          automatically. Everything is saved to the school database and shared with the pupil and
          parent portals once published.
        </p>
      </div>
      <ReportCardWorkspace />
      <div className="print:hidden">
        <SchoolInfoPanel sections={["grading", "terms"]} />
      </div>
    </div>
  </StaffLayout>
);

export default StaffReportCard;
