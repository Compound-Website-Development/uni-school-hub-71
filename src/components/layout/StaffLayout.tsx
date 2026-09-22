import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { MobileHeader } from "./MobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, ChevronRight, LayoutDashboard, UsersRound, ClipboardList, BookOpen, CalendarCheck, Table2, MonitorPlay, NotebookPen, FileBarChart2, GraduationCap, UserPlus, Mail, MessagesSquare, CalendarClock, UserCircle } from "lucide-react";
import npsLogo from "@/assets/logo";
import { cn } from "@/lib/utils";

interface StaffLayoutProps { children: ReactNode; title?: string; showSearch?: boolean; searchPlaceholder?: string; }

const items = [
 {icon:LayoutDashboard,label:"Dashboard",href:"/staff"},
 {icon:UsersRound,label:"Community Wall",href:"/staff/wall"},
 {icon:UsersRound,label:"Students",href:"/staff/students"},
 {icon:BookOpen,label:"Classes",href:"/staff/classes"},
 {icon:CalendarCheck,label:"Attendance",href:"/staff/attendance"},
 {icon:Table2,label:"Gradebook",href:"/staff/gradebook"},
 {icon:MonitorPlay,label:"CBT Studio",href:"/staff/cbt"},
 {icon:NotebookPen,label:"Assignments",href:"/staff/assignments"},
 {icon:FileBarChart2,label:"Lesson Plans",href:"/staff/lesson-plans"},
 {icon:GraduationCap,label:"Reports",href:"/staff/reports"},
 {icon:ClipboardList,label:"Report Cards",href:"/staff/report-card"},
 {icon:UserPlus,label:"Admissions",href:"/staff/admissions"},
 {icon:Mail,label:"Messages",href:"/staff/messages"},
 {icon:MessagesSquare,label:"Forum",href:"/staff/forum"},
 {icon:CalendarClock,label:"Leave",href:"/staff/leave"},
 {icon:UserCircle,label:"My Profile",href:"/staff/profile"}
] as const;

export const StaffLayout=({children,title}:StaffLayoutProps)=>{
 const [open,setOpen]=useState(false);
 const {signOut,teacherData,userRole}=useAuth();
 useRealtimeNotifications();
 const nav=useNavigate();
 const loc=useLocation();
 const name=teacherData?`${teacherData.first_name} ${teacherData.last_name}`:"Staff";
 const initials=name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const active=(href:string)=>loc.pathname===href||loc.pathname.startsWith(href+"/");
 const logout=async()=>{await signOut();nav("/login");};
 const Nav=({close}:{close?:()=>void})=><div className="space-y-1.5">{items.map(({icon:Icon,...item},index)=><Link key={item.href} to={item.href} onClick={close} className={cn("portal-nav-item group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all",active(item.href)&&"active")}><span className="portal-nav-icon grid h-9 w-9 place-items-center rounded-xl transition-all"><Icon className="h-[18px] w-[18px] stroke-[1.8]"/></span><span className="flex-1 truncate">{item.label}</span>{active(item.href)&&<ChevronRight className="h-4 w-4 opacity-55"/>}</Link>)}</div>;

 return <div className="staff-portal-shell min-h-screen bg-background portal-page-bg">
   <MobileHeader title={title||"Staff Portal"} onMenuClick={()=>setOpen(true)}/>
   <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="portal-sidebar w-[88%] max-w-sm border-0 p-0"><SheetHeader className="portal-logo-card border-b p-5 text-left"><div className="flex items-center gap-3"><img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/><SheetTitle className="text-foreground">Staff Workspace</SheetTitle></div></SheetHeader><nav className="h-[calc(100%-7rem)] overflow-y-auto p-4"><Nav close={()=>setOpen(false)}/></nav><button onClick={logout} className="sidebar-muted mx-4 flex w-[calc(100%-2rem)] items-center gap-3 border-t border-border py-4 text-sm font-semibold"><LogOut className="h-4 w-4"/>Sign out</button></SheetContent></Sheet>
   <div className="hidden min-h-screen md:flex">
     <aside className="portal-sidebar sticky top-0 flex h-screen w-[270px] shrink-0 flex-col overflow-hidden p-4">
       <div className="portal-logo-card mb-5 flex items-center gap-3 rounded-3xl p-4"><img src={npsLogo} className="h-10 w-auto" alt="Imagemakers"/><div><p className="portal-display text-base font-bold">Staff Workspace</p><p className="sidebar-muted text-[10px]">Class teacher tools</p></div></div>
       <div className="mb-4 flex items-center gap-3 rounded-3xl border border-[#e3ddd2] bg-white p-3"><div className="portal-avatar grid h-11 w-11 place-items-center rounded-2xl font-black">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="sidebar-muted text-[10px]">{userRole||"Teacher"}</p></div></div>
       <nav className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"><Nav/></nav>
       <button onClick={logout} className="sidebar-muted mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#efede7] hover:text-foreground"><LogOut className="h-4 w-4"/>Sign out</button>
     </aside>
     <main className="min-w-0 flex-1 overflow-y-auto"><div className="portal-page-content mx-auto w-full max-w-[1500px] p-4 md:p-6 lg:p-9">{children}</div></main>
   </div>
   <div className="portal-page-content px-3 pb-6 md:hidden">{children}</div>
 </div>;
};
