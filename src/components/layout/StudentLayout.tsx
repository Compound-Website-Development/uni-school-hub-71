import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StudentTools } from "@/components/StudentTools";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LogOut, Menu, Bell, ArrowLeft, ChevronRight, Home, GraduationCap, ClipboardList,
  FileText, ScrollText, MonitorPlay, NotebookPen, BookOpen, CalendarDays, CheckCircle2,
  Megaphone, UsersRound, CircleHelp, WalletCards, UserCircle, Settings2, LibraryBig,
  PanelTopOpen, Clock3
} from "lucide-react";
import { cn } from "@/lib/utils";
import npsLogo from "@/assets/logo";

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
    { icon:Home, label:"Home", href:"/student" },
    { icon:GraduationCap, label:"My Results", href:"/student/grades" },
    { icon:ClipboardList, label:"Report Cards", href:"/student/reports" },
    { icon:ScrollText, label:"Transcript", href:"/student/transcript" },
    { icon:MonitorPlay, label:"CBT Exams", href:"/student/exams" },
    { icon:NotebookPen, label:"Homework", href:"/student/homework" },
    { icon:BookOpen, label:"Learning Hub", href:"/student/learning" },
    { icon:LibraryBig, label:"Library", href:"/student/library" },
  ]},
  { heading: "School life", items: [
    { icon:Clock3, label:"Schedule", href:"/student/schedule" },
    { icon:CheckCircle2, label:"Attendance", href:"/student/attendance" },
    { icon:CalendarDays, label:"Calendar", href:"/student/calendar" },
    { icon:Megaphone, label:"Announcements", href:"/student/announcements" },
    { icon:UsersRound, label:"Community Wall", href:"/student/wall" },
    { icon:CircleHelp, label:"Complaints", href:"/student/complaints" },
  ]},
  { heading: "Account", items: [
    { icon:WalletCards, label:"Fee Payments", href:"/student/fees" },
    { icon:UserCircle, label:"My Profile", href:"/student/profile" },
    { icon:Settings2, label:"Settings", href:"/student/settings" },
  ]},
] as const;

const quickItems = [
  { icon:Home, label:"Home", href:"/student" },
  { icon:GraduationCap, label:"Results", href:"/student/grades" },
  { icon:NotebookPen, label:"Homework", href:"/student/homework" },
  { icon:MonitorPlay, label:"CBT", href:"/student/exams" },
  { icon:CalendarDays, label:"Schedule", href:"/student/schedule" },
] as const;

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

  const DrawerNav = () => (
    <div className="space-y-6 p-1">
      {navGroups.map(group => (
        <section key={group.heading}>
          <p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">{group.heading}</p>
          <div className="space-y-1">
            {group.items.map(({icon:Icon,...item}) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href} onClick={() => setDrawerOpen(false)}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors", active ? "bg-[#e9f5ff] text-[#1685c4]" : "text-foreground hover:bg-muted")}>
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8}/>
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-4 w-4 opacity-60" />}
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
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="student-mobile-drawer w-[90%] max-w-sm border-0 bg-white p-4 shadow-2xl">
          <SheetHeader className="border-b border-[#dcecf5] pb-4 text-left">
            <div className="flex items-center gap-3">
              <img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/>
              <div><SheetTitle className="text-[#16384b]">Student Space</SheetTitle><p className="text-xs text-[#78909d]">{studentName}</p></div>
            </div>
          </SheetHeader>
          <nav className="h-[calc(100%-8rem)] overflow-y-auto py-4"><DrawerNav/></nav>
          <button onClick={logout} className="flex w-full items-center gap-3 border-t border-[#dcecf5] py-4 text-sm font-bold text-[#657169]"><LogOut className="h-4 w-4"/>Sign out</button>
        </SheetContent>
      </Sheet>

      <main className="student-page-content mx-auto w-full max-w-[1500px] px-3 pb-28 pt-4 md:px-6 md:pb-12 md:pt-7 lg:px-9">
        {children}
      </main>
      {!publicView && <StudentTools studentId={studentData?.id}/>}
      {!publicView && <BottomNavigation /> }
    </div>
  );
};
