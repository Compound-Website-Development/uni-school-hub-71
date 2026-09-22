import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { MobileHeader } from "./MobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PortalIconArt } from "@/components/PortalIconArt";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Menu, ChevronRight } from "lucide-react";
import npsLogo from "@/assets/logo";
import { cn } from "@/lib/utils";

interface StaffLayoutProps { children: ReactNode; title?: string; showSearch?: boolean; searchPlaceholder?: string; }

const items = [
 {kind:"home",label:"Dashboard",href:"/staff"},{kind:"people",label:"Community Wall",href:"/staff/wall"},{kind:"people",label:"Students",href:"/staff/students"},
 {kind:"book",label:"Classes",href:"/staff/classes"},{kind:"attendance",label:"Attendance",href:"/staff/attendance"},{kind:"book",label:"Gradebook",href:"/staff/gradebook"},
 {kind:"cbt",label:"CBT Studio",href:"/staff/cbt"},{kind:"book",label:"Assignments",href:"/staff/assignments"},{kind:"book",label:"Lesson Plans",href:"/staff/lesson-plans"},
 {kind:"book",label:"Reports",href:"/staff/reports"},{kind:"book",label:"Report Cards",href:"/staff/report-card"},{kind:"people",label:"Admissions",href:"/staff/admissions"},
 {kind:"message",label:"Messages",href:"/staff/messages"},{kind:"message",label:"Forum",href:"/staff/forum"},{kind:"calendar",label:"Leave",href:"/staff/leave"},{kind:"profile",label:"My Profile",href:"/staff/profile"}
] as const;

export const StaffLayout=({children,title}:StaffLayoutProps)=>{
 const [open,setOpen]=useState(false); const {signOut,teacherData,userRole}=useAuth(); useRealtimeNotifications(); const nav=useNavigate(); const loc=useLocation();
 const name=teacherData?`${teacherData.first_name} ${teacherData.last_name}`:"Staff"; const initials=name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const active=(href:string)=>loc.pathname===href||loc.pathname.startsWith(href+"/");
 const logout=async()=>{await signOut();nav("/login");};
 const Nav=({close}:{close?:()=>void})=><div className="space-y-1.5">{items.map(item=><Link key={item.href} to={item.href} onClick={close} className={cn("group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-semibold transition-all",active(item.href)?"bg-white text-[hsl(var(--navy))] shadow-lg":"text-white/72 hover:bg-white/10 hover:text-white")}><span className={cn("grid h-9 w-9 place-items-center rounded-xl",active(item.href)?"bg-primary/10":"bg-white/8")}><PortalIconArt kind={item.kind} className="h-7 w-7"/></span><span className="flex-1 truncate">{item.label}</span>{active(item.href)&&<ChevronRight className="h-4 w-4"/>}</Link>)}</div>;
 return <div className="min-h-screen bg-background portal-page-bg"><MobileHeader title={title||"Staff Portal"} onMenuClick={()=>setOpen(true)}/>
 <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="w-[88%] max-w-sm border-0 bg-[hsl(var(--navy))] p-0 text-white"><SheetHeader className="border-b border-white/10 p-5 text-left"><div className="flex items-center gap-3"><img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/><SheetTitle className="text-white">Staff Workspace</SheetTitle></div></SheetHeader><nav className="h-[calc(100%-7rem)] overflow-y-auto p-4"><Nav close={()=>setOpen(false)}/></nav><button onClick={logout} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 border-t border-white/10 py-4 text-sm font-semibold text-white/70"><LogOut className="h-4 w-4"/>Sign out</button></SheetContent></Sheet>
 <div className="hidden min-h-screen md:flex"><aside className="sticky top-0 flex h-screen w-[292px] shrink-0 flex-col overflow-hidden bg-[hsl(var(--navy))] p-4 text-white shadow-2xl"><div className="mb-5 flex items-center gap-3 rounded-3xl bg-white/8 p-4"><img src={npsLogo} className="h-10 w-auto" alt="Imagemakers"/><div><p className="portal-display text-base font-bold">Staff Workspace</p><p className="text-[10px] text-white/50">Class teacher tools</p></div></div><div className="mb-4 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/6 p-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-white to-white/70 text-primary font-black">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="text-[10px] text-white/50">{userRole||"Teacher"}</p></div></div><nav className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"><Nav/></nav><button onClick={logout} className="mt-3 flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/12 hover:text-white"><LogOut className="h-4 w-4"/>Sign out</button></aside><main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[1500px] p-6 lg:p-9">{children}</div></main></div><div className="px-3 pb-6 md:hidden">{children}</div></div>;
};