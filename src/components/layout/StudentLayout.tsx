import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StudentTools } from "@/components/StudentTools";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, ChevronRight, Home, GraduationCap, ClipboardList, ScrollText, MonitorPlay, NotebookPen, BookOpen, CalendarDays, CheckCircle2, Megaphone, UsersRound, CircleHelp, WalletCards, UserCircle, Settings2, LibraryBig, Clock3 } from "lucide-react";
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

export const StudentLayout = ({ children, title, studentNameOverride, studentIdOverride, publicView = false }: StudentLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  useRealtimeNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = studentNameOverride || (studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student");
  const initials = studentName.split(/\s+/).map(n => n[0]).join("").slice(0,2).toUpperCase();
  const isActive = (href:string) => location.pathname === href || (href !== "/student" && location.pathname.startsWith(href + "/"));
  const logout = async () => { await signOut(); navigate("/login"); };

  const Nav = ({ close }: { close?: () => void }) => (
    <div className="space-y-5">
      {navGroups.map(group => (
        <section key={group.heading}>
          <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[.2em] text-[#5d87a0]">{group.heading}</p>
          <div className="space-y-1">
            {group.items.map(({icon:Icon,...item}) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href} onClick={close}
                  className={cn("student-nav-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[12px] font-bold transition-all", active ? "active" : "text-[#49677a] hover:bg-[#eef8fd] hover:text-[#167db7]")}>
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all", active ? "bg-[#dff2fc] text-[#167db7] shadow-[0_8px_20px_-14px_rgba(22,125,183,.8)]" : "bg-[#f4f9fc] text-[#6d8796]")}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.9}/>
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-[#2f8fca]"/>}
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
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="student-mobile-drawer w-[90%] max-w-sm border-0 bg-white p-4 shadow-2xl">
          <SheetHeader className="border-b border-[#dcecf5] pb-4 text-left">
            <div className="flex items-center gap-3">
              <img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/>
              <div><SheetTitle className="text-[#16384b]">Student Space</SheetTitle><p className="text-xs text-[#78909d]">{studentName}</p></div>
            </div>
          </SheetHeader>
          <nav className="h-[calc(100%-8rem)] overflow-y-auto py-4"><Nav close={()=>setDrawerOpen(false)}/></nav>
          <button onClick={logout} className="flex w-full items-center gap-3 border-t border-[#dcecf5] py-4 text-sm font-bold text-[#49677a]"><LogOut className="h-4 w-4"/>Sign out</button>
        </SheetContent>
      </Sheet>

      <div className="hidden min-h-screen md:flex">
        <aside className="student-sidebar sticky top-0 flex h-screen w-[258px] shrink-0 flex-col overflow-hidden border-r border-[#d7eaf4] bg-white/82 p-4 backdrop-blur-2xl">
          <div className="student-brand-card mb-5 rounded-[26px] border border-[#dcecf5] bg-gradient-to-br from-white to-[#edf8fd] p-4">
            <div className="flex items-center gap-3">
              <img src={npsLogo} className="h-10 w-auto" alt="Imagemakers"/>
              <div><p className="font-black text-[#17394c]">Student Space</p><p className="text-[10px] font-semibold text-[#6c8796]">{studentName}</p></div>
            </div>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"><Nav/></nav>
          <button onClick={logout} className="mt-3 flex items-center gap-3 rounded-2xl border-t border-[#dcecf5] px-3 py-3 text-xs font-bold text-[#557286] hover:bg-[#eef8fd] hover:text-[#167db7]"><LogOut className="h-4 w-4"/>Sign out</button>
        </aside>
        <main className="student-page-content min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      <div className="md:hidden">
        <main className="student-page-content mx-auto w-full max-w-[900px] px-3 pb-24 pt-4">{children}</main>
      </div>

      {!publicView && <StudentTools studentId={studentData?.id}/>}
      {!publicView && <BottomNavigation />}
    </div>
  );
};
