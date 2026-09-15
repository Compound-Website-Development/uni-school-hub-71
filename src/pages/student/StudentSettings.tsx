import { StudentLayout } from "@/components/layout/StudentLayout";
import { useAuth } from "@/hooks/useAuth";
import { StudentPhoto } from "@/components/StudentPhoto";
import { AppCard, RuleList, ListRow, IconBadge } from "@/components/student/editorial";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, Bell, HelpCircle, MessageSquare, History, Shield, Mail,
  IdCard, FileText, LogOut, Users,
} from "lucide-react";

const StudentSettings = () => {
  const { studentData, user, signOut } = useAuth();
  const navigate = useNavigate();

  const name = studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student";

  return (
    <StudentLayout title="Settings">
      <div className="mx-auto w-full max-w-3xl space-y-4 pb-6">
        {/* Identity */}
        <AppCard className="animate-fade-up">
          <div className="flex items-center gap-3.5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-[3px] ring-primary/20">
              <StudentPhoto
                photoRef={(studentData as any)?.photo_url}
                alt={name}
                fallback={
                  <span className="grid h-full w-full place-items-center bg-primary/10 font-display text-base font-bold text-primary">
                    {(studentData?.first_name?.[0] || "S") + (studentData?.last_name?.[0] || "")}
                  </span>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display truncate text-[17px] font-extrabold tracking-tight text-foreground">{name}</h2>
              <p className="num truncate text-[12px] font-semibold text-muted-foreground">
                {studentData?.student_id || "—"}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">{user?.email || studentData?.email || ""}</p>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <Link
              to="/student/profile"
              className="press flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-[13px] font-bold text-primary"
            >
              <IdCard className="h-4 w-4" /> View Profile
            </Link>
            <Link
              to="/student/reports"
              className="press flex items-center justify-center gap-2 rounded-xl bg-muted py-2.5 text-[13px] font-bold text-foreground"
            >
              <FileText className="h-4 w-4" /> View Docs
            </Link>
          </div>
        </AppCard>

        <RuleList>
          <li><ListRow icon={BookOpen} title="My Subjects" subtitle="Results by subject" href="/student/grades" /></li>
          <li><ListRow icon={Bell} tone="warning" title="Notifications" subtitle="View all school notices" href="/student/announcements" /></li>
          <li><ListRow icon={HelpCircle} tone="destructive" title="Raise a Query" subtitle="Log a complaint or request" href="/student/complaints" /></li>
          <li><ListRow icon={History} tone="success" title="Timeline & Feedback" subtitle="Attendance and register history" href="/student/attendance" /></li>
          <li><ListRow icon={MessageSquare} tone="accent" title="Community Wall" subtitle="School conversations" href="/student/wall" /></li>
          <li><ListRow icon={Users} title="Guardian Details" subtitle={studentData?.guardian_name || "Not provided"} href="/student/profile" /></li>
        </RuleList>

        <RuleList>
          <li><ListRow icon={Shield} tone="destructive" title="Security" subtitle="Change your password" href="/reset-password" /></li>
          <li>
            <ListRow
              icon={Mail}
              tone="muted"
              title="Account Email"
              subtitle={user?.email || "Not set"}
              right={<span />}
            />
          </li>
        </RuleList>

        <button
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3.5 text-[14px] font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>

        <p className="text-center text-[12px] text-muted-foreground">
          Contact your school administrator to update personal records.
        </p>
      </div>
    </StudentLayout>
  );
};

export default StudentSettings;
