import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StudentTools } from "@/components/StudentTools";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, Menu, Bell, ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import npsLogo from "@/assets/logo";
import { PortalIllustration } from "@/components/PortalIllustration";

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  back?: string;
  studentNameOverride?: string;
  studentIdOverride?: string;
  publicView?: boolean;
}

const navGroups = [
  { heading: "Learn", items: [
    { kind:"home", label:"Home", href:"/student" }, { kind:"results", label:"My Results", href:"/student/grades" },
    { kind:"report", label:"Report Cards", href:"/student/reports" }, { kind:"transcript", label:"Transcript", href:"/student/transcript" },
    { kind:"cbt", label:"CBT Exams", href:"/student/exams" }, { kind:"homework", label:"Homework", href:"/student/homework" },
    { kind:"learning", label:"Learning Hub", href:"/student/learning" }, { kind:"resources", label:"Resources", href:"/student/resources" },
    { kind:"library", label:"Library", href:"/student/library" },
  ]},
  { heading: "School life", items: [
    { kind:"schedule", label:"Schedule", href:"/student/schedule" }, { kind:"attendance", label:"Attendance", href:"/student/attendance" },
    { kind:"calendar", label:"Calendar", href:"/student/calendar" }, { kind:"announcements", label:"Announcements", href:"/student/announcements" },
    { kind:"community", label:"Community Wall", href:"/student/wall" }, { kind:"complaints", label:"Complaints", href:"/student/complaints" },
  ]},
  { heading: "Account", items: [
    { kind:"fees", label:"Fee Payments", href:"/student/fees" }, { kind:"profile", label:"My Profile", href:"/student/profile" },
    { kind:"settings", label:"Settings", href:"/student/settings" },
  ]},
] as const;

const allItems = navGroups.flatMap(group => group.items);

export const StudentLayout = ({ children, title, back, studentNameOverride, studentIdOverride, publicView = false }: StudentLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  useRealtimeNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = studentNameOverride || (studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student");
  const initials = studentName.split(/\s+/).map(n => n[0]).join("").slice(0,2).toUpperCase();
  const isActive = (href:string) => location.pathname === href || (href !== "/student" && location.pathname.startsWith(href + "/"));
  const logout = async () => { await signOut(); navigate("/login"); };

  const NavLinks = ({ close }:{close?:()=>void}) => (
    <div className="student-topnav-links flex gap-1 overflow-x-auto">
      {allItems.map(item => {
        const active = isActive(item.href);
        return (
          <Link key={item.href} to={item.href} onClick={close}
            className={cn("student-topnav-link", active && "active")}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  const DrawerNav = () => (
    <div className="space-y-7 p-2">
      {navGroups.map(group => (
        <section key={group.heading}>
          <p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">{group.heading}</p>
          <div className="space-y-1">
            {group.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href} onClick={() => setDrawerOpen(false)}
                  className={cn("flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition", active ? "bg-[#e6efe8] text-[#416b52]" : "text-foreground hover:bg-muted")}>
                  <PortalIllustration kind={item.kind as any} size="sm" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-4 w-4" />}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="student-portal-shell min-h-screen bg-background portal-page-bg">
      <header className="student-topnav">
        <div className="mx-auto flex min-h-[68px] max-w-[1500px] items-center gap-3 px-3 md:px-6">
          {back ? (
            <Link to={back} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e6efe8] text-[#416b52]"><ArrowLeft className="h-5 w-5"/></Link>
          ) : (
            <button onClick={() => setDrawerOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#416b52] text-white" aria-label="Open student navigation"><Menu className="h-5 w-5"/></button>
          )}
          <Link to="/student" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/>
            <div className="hidden sm:block">
              <p className="portal-display text-sm font-extrabold text-foreground">Student Space</p>
              <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Learn · Grow · Achieve</p>
            </div>
          </Link>
          <div className="hidden min-w-0 flex-1 md:block"><NavLinks/></div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeToggle/>
            <Link to="/student/announcements" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[#eef3ef] text-[#416b52]" aria-label="Announcements">
              <Bell className="h-5 w-5"/>
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d28b4d]"/>
            </Link>
            <div className="hidden h-10 items-center gap-2 rounded-2xl border border-border bg-white px-2.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#e6efe8] text-xs font-extrabold text-[#416b52]">{initials}</span>
              <span className="max-w-[120px] truncate text-xs font-bold">{studentName}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 md:hidden">
          <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1"><NavLinks/></div>
          </div>
        </div>
      </header>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="student-mobile-drawer w-[88%] max-w-sm p-4">
          <SheetHeader className="border-b border-border pb-4 text-left">
            <div className="flex items-center gap-3">
              <img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/>
              <div><SheetTitle className="text-foreground">Student Space</SheetTitle><p className="text-xs text-muted-foreground">{studentName}</p></div>
            </div>
          </SheetHeader>
          <nav className="h-[calc(100%-8rem)] overflow-y-auto py-4"><DrawerNav/></nav>
          <button onClick={logout} className="flex w-full items-center gap-3 border-t border-border py-4 text-sm font-bold text-muted-foreground"><LogOut className="h-4 w-4"/>Sign out</button>
        </SheetContent>
      </Sheet>

      <main className="student-page-content mx-auto w-full max-w-[1500px] px-3 pb-8 pt-4 md:px-6 md:pb-12 md:pt-7 lg:px-9">
        {children}
      </main>

      {!publicView && studentData?.id && <StudentTools studentId={studentData.id}/>}
    </div>
  );
};
