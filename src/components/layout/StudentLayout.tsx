import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StudentTools } from "@/components/StudentTools";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ArrowRight, Bell, CalendarDays, CheckCircle2, ClipboardList, GraduationCap,
  Home, LayoutGrid, Library, LogOut, Menu, MessageSquare, NotebookPen,
  ScrollText, Settings2, UserCircle, WalletCards, BookOpen, MonitorPlay
} from "lucide-react";
import { cn } from "@/lib/utils";
import npsLogo from "@/assets/logo";
import "@/styles/student-portal.css";

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  back?: string;
  studentNameOverride?: string;
  studentIdOverride?: string;
  publicView?: boolean;
}

const navGroups = [
  {
    heading: "Learn",
    items: [
      { icon: Home, label: "Home", href: "/student" },
      { icon: GraduationCap, label: "My Results", href: "/student/grades" },
      { icon: ClipboardList, label: "Report Cards", href: "/student/reports" },
      { icon: ScrollText, label: "Transcript", href: "/student/transcript" },
      { icon: MonitorPlay, label: "CBT Exams", href: "/student/exams" },
      { icon: NotebookPen, label: "Homework", href: "/student/homework" },
      { icon: BookOpen, label: "Learning Hub", href: "/student/learning" },
      { icon: Library, label: "Library", href: "/student/library" },
    ],
  },
  {
    heading: "School life",
    items: [
      { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
      { icon: CheckCircle2, label: "Attendance", href: "/student/attendance" },
      { icon: CalendarDays, label: "Calendar", href: "/student/calendar" },
      { icon: Bell, label: "Announcements", href: "/student/announcements" },
      { icon: MessageSquare, label: "Community Wall", href: "/student/wall" },
      { icon: ClipboardList, label: "Complaints", href: "/student/complaints" },
    ],
  },
  {
    heading: "Account",
    items: [
      { icon: WalletCards, label: "Fee Payments", href: "/student/fees" },
      { icon: UserCircle, label: "My Profile", href: "/student/profile" },
      { icon: Settings2, label: "Settings", href: "/student/settings" },
    ],
  },
] as const;

const mobileNav = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: GraduationCap, label: "Results", href: "/student/grades" },
  { icon: NotebookPen, label: "Homework", href: "/student/homework" },
  { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
  { icon: UserCircle, label: "Profile", href: "/student/profile" },
] as const;

export const StudentLayout = ({
  children,
  title,
  back,
  studentNameOverride,
  studentIdOverride,
  publicView = false,
}: StudentLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  useRealtimeNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  const studentName =
    studentNameOverride ||
    (studentData ? `${studentData.first_name} ${studentData.last_name}`.trim() : "Student");
  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .map((value) => value[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/student" && location.pathname.startsWith(`${href}/`));

  const logout = async () => {
    await signOut();
    navigate("/login");
  };

  const Navigation = ({ close }: { close?: () => void }) => (
    <div className="student-sidebar-nav">
      {navGroups.map((group) => (
        <section key={group.heading}>
          <p className="student-nav-heading">{group.heading}</p>
          <div className="space-y-1.5">
            {group.items.map(({ icon: Icon, label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={close}
                  className={cn("student-nav-item", active && "is-active")}
                >
                  <span className="student-nav-icon">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {active && <ArrowRight className="h-3.5 w-3.5 opacity-65" />}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="student-portal-shell min-h-screen bg-background">
      {!publicView && (
        <aside className="student-desktop-sidebar">
          <div className="student-brand-card">
            <div className="student-brand-mark">
              <img src={npsLogo} alt="Imagemakers" className="h-9 w-auto" />
            </div>
            <div className="min-w-0">
              <p className="student-brand-title">Imagemakers</p>
              <p className="student-brand-subtitle">Student space</p>
            </div>
          </div>

          <div className="student-profile-card">
            <div className="student-avatar">{initials}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{studentName}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[.12em] text-white/60">
                {studentIdOverride || studentData?.student_id || "Pupil account"}
              </p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
            <Navigation />
          </nav>

          <div className="student-sidebar-bottom">
            <Link
              to="/student/settings"
              className="student-sidebar-utility"
            >
              <Settings2 className="h-4 w-4" />
              <span>Account settings</span>
            </Link>
            <button onClick={logout} className="student-sidebar-utility text-white/65 hover:text-white">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>
      )}

      {!publicView && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="student-mobile-drawer w-[88%] max-w-sm border-0 p-0 text-white"
          >
            <SheetHeader className="border-b border-white/12 px-5 py-5 text-left">
              <div className="flex items-center gap-3">
                <div className="student-brand-mark">
                  <img src={npsLogo} alt="Imagemakers" className="h-8 w-auto" />
                </div>
                <div>
                  <SheetTitle className="text-white">Student space</SheetTitle>
                  <p className="mt-0.5 text-xs text-white/60">{studentName}</p>
                </div>
              </div>
            </SheetHeader>
            <nav className="h-[calc(100%-8.5rem)] overflow-y-auto px-4 py-4">
              <Navigation close={() => setMobileOpen(false)} />
            </nav>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-4 text-sm font-semibold text-white/70"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </SheetContent>
        </Sheet>
      )}

      {!publicView && (
        <header className="student-mobile-header">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="student-header-button"
              aria-label="Open student navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="student-mobile-header-kicker">Imagemakers</p>
              <p className="student-mobile-header-title">{title || "Student space"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              to="/student/announcements"
              className="student-header-button"
              aria-label="Announcements"
            >
              <Bell className="h-4.5 w-4.5" />
            </Link>
          </div>
        </header>
      )}

      <main
        className={cn(
          "student-main",
          publicView ? "student-main-public" : "student-main-with-sidebar",
        )}
      >
        <div className="student-page-content">
          {back && (
            <Link to={back} className="student-back-link">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Back
            </Link>
          )}
          {children}
        </div>
      </main>

      {!publicView && (
        <nav className="student-bottom-nav" aria-label="Student quick navigation">
          {mobileNav.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              to={href}
              className={cn("student-bottom-nav-item", isActive(href) && "is-active")}
            >
              <span className="student-bottom-nav-icon">
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} />
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      )}

      {!publicView && <StudentTools studentId={studentData?.id || undefined} />}
    </div>
  );
};

export default StudentLayout;
