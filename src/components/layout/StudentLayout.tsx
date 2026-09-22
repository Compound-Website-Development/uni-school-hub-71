import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { StudentTools } from "@/components/StudentTools";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PortalIconArt } from "@/components/PortalIconArt";
import { LogOut, Menu, Bell, ArrowLeft, ChevronRight } from "lucide-react";
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
    { kind:"home", label:"Home", href:"/student" }, { kind:"book", label:"My Results", href:"/student/grades" },
    { kind:"book", label:"Report Cards", href:"/student/reports" }, { kind:"book", label:"Transcript", href:"/student/transcript" },
    { kind:"cbt", label:"CBT Exams", href:"/student/exams" }, { kind:"book", label:"Homework", href:"/student/homework" },
    { kind:"book", label:"Learning Hub", href:"/student/learning" }, { kind:"book", label:"Resources", href:"/student/resources" },
    { kind:"book", label:"Library", href:"/student/library" },
  ]},
  { heading: "School life", items: [
    { kind:"calendar", label:"Schedule", href:"/student/schedule" }, { kind:"attendance", label:"Attendance", href:"/student/attendance" },
    { kind:"calendar", label:"Calendar", href:"/student/calendar" }, { kind:"message", label:"Announcements", href:"/student/announcements" },
    { kind:"people", label:"Community Wall", href:"/student/wall" }, { kind:"message", label:"Complaints", href:"/student/complaints" },
  ]},
  { heading: "Account", items: [
    { kind:"finance", label:"Fee Payments", href:"/student/fees" }, { kind:"profile", label:"My Profile", href:"/student/profile" },
    { kind:"settings", label:"Settings", href:"/student/settings" },
  ]},
] as const;

const bottom = [
  { kind:"home", label:"Home", href:"/student" }, { kind:"book", label:"Grades", href:"/student/grades" },
  { kind:"cbt", label:"CBT", href:"/student/exams" }, { kind:"calendar", label:"Schedule", href:"/student/schedule" },
  { kind:"profile", label:"Profile", href:"/student/profile" },
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

  const Nav = ({ close }:{close?:()=>void}) => (
    <div className="space-y-7">
      {navGroups.map(group => <section key={group.heading}>
        <p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-sidebar-foreground/45">{group.heading}</p>
        <div className="space-y-1">
          {group.items.map(item => {
            const active=isActive(item.href);
            return <Link key={item.href} to={item.href} onClick={close} className={cn("group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-300", active ? "bg-white/16 text-white shadow-lg shadow-black/5" : "text-white/72 hover:bg-white/10 hover:text-white")}>
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all", active ? "bg-white text-primary shadow-md" : "bg-white/8 group-hover:bg-white/15")}><PortalIconArt kind={item.kind} className="h-7 w-7" /></span>
              <span className="flex-1 truncate">{item.label}</span>{active && <ChevronRight className="h-4 w-4 opacity-60" />}
            </Link>
          })}
        </div>
      </section>)}
    </div>
  );

  return <div className="min-h-screen bg-background portal-page-bg">
    <header className="sticky top-0 z-40 border-b border-border/50 bg-card/75 backdrop-blur-2xl md:hidden">
      <div className="flex h-16 items-center gap-2 px-3">
        {back ? <Link to={back} className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><ArrowLeft className="h-5 w-5"/></Link> : <button onClick={()=>setDrawerOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white"><Menu className="h-5 w-5"/></button>}
        <div className="min-w-0 flex-1"><p className="portal-display truncate text-[16px] font-bold">{title || "Student Portal"}</p><p className="truncate text-[10px] text-muted-foreground">{studentIdOverride || studentData?.student_id || studentName}</p></div>
        <ThemeToggle/><Link to="/student/announcements" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-5 w-5"/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent"/></Link>
      </div>
    </header>

    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}><SheetContent side="left" className="w-[88%] max-w-sm border-0 bg-[hsl(var(--navy))] p-0 text-white">
      <SheetHeader className="border-b border-white/10 px-5 py-5 text-left"><div className="flex items-center gap-3"><img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/><div><SheetTitle className="text-white">Student Portal</SheetTitle><p className="text-xs text-white/55">{studentName}</p></div></div></SheetHeader>
      <nav className="h-[calc(100%-9rem)] overflow-y-auto p-4"><Nav close={()=>setDrawerOpen(false)}/></nav>
      <button onClick={logout} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 border-t border-white/10 py-4 text-sm font-semibold text-white/70"><LogOut className="h-4 w-4"/>Sign out</button>
    </SheetContent></Sheet>

    <div className="hidden min-h-screen md:flex">
      <aside className="sticky top-0 flex h-screen w-[292px] shrink-0 flex-col overflow-hidden bg-[hsl(var(--navy))] p-4 text-white shadow-2xl shadow-[hsl(var(--navy)/.2)]">
        <div className="mb-5 flex items-center gap-3 rounded-3xl bg-white/8 p-4"><img src={npsLogo} className="h-10 w-auto" alt="Imagemakers"/><div className="min-w-0"><p className="portal-display truncate text-base font-bold">Student Portal</p><p className="truncate text-[10px] text-white/50">{studentIdOverride || studentData?.student_id || studentName}</p></div></div>
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/6 p-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-white to-white/70 text-primary font-black">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{studentName}</p><p className="text-[10px] text-white/50">{publicView ? "Public record view" : "Learner account"}</p></div></div>
        <nav className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"><Nav/></nav>
        <button onClick={logout} className="mt-3 flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/12 hover:text-white"><LogOut className="h-4 w-4"/>Sign out</button>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[1500px] p-6 lg:p-9">{children}</div></main>
    </div>
    <div className="pb-24 md:hidden px-3 pt-3">{children}</div>
    <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[28px] border border-white/40 bg-card/90 p-2 shadow-2xl backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {bottom.map(item=>{const active=isActive(item.href);return <Link key={item.href} to={item.href} className={cn("relative flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300",active?"bg-primary text-white -translate-y-1 shadow-lg shadow-primary/25":"text-muted-foreground hover:bg-muted/50")}><PortalIconArt kind={item.kind} className="h-7 w-7"/><span className="text-[9px] font-extrabold">{item.label}</span>{active&&<span className="absolute -bottom-1 h-1 w-8 rounded-full bg-accent"/>}</Link>})}
      </div>
    </nav>
    {!publicView && studentData?.id && <StudentTools studentId={studentData.id}/>}
  </div>;
};