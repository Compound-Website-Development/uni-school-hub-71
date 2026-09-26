import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { MobileHeader } from "./MobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { LucideIcon } from "lucide-react";
import {
  LogOut, ChevronRight, ExternalLink, LayoutDashboard, BarChart3, Activity,
  GraduationCap, BriefcaseBusiness, UserCheck, WalletCards, Receipt, Mail,
  ChartPie, Megaphone, FileSpreadsheet, Sparkles, ClipboardPenLine, HeartPulse,
  MonitorPlay, BusFront, LibraryBig, Route, DoorOpen, Boxes, ArrowLeftRight,
  ContactRound, Award, MessageSquareWarning, ListChecks, Upload, Users,
  ScrollText, Files, Settings2, UserCog, School, House
} from "lucide-react";
import npsLogo from "@/assets/logo";
import { cn } from "@/lib/utils";

interface AdminLayoutProps { children: ReactNode; title?: string; showSearch?: boolean; searchPlaceholder?: string; }

const sections=[
 {label:"Overview",items:[["home","Dashboard","/admin"],["book","Analytics","/admin/analytics"],["message","Activity Logs","/admin/activity"]]},
 {label:"People",items:[["people","Students","/admin/students"],["people","Staff","/admin/staff"],["people","Pending Approvals","/admin/approvals"]]},
 {label:"Finance Portal",items:[["finance","Finance Dashboard","/admin/finance"],["finance","Fee Setup","/admin/fees"],["finance","Financial Intelligence","/admin/financial"],["book","Finance Reports","/admin/reports"]]},\n {label:"Communication",items:[["message","Message Templates","/admin/communication"],["message","Announcements","/admin/announcements"]]},
 {label:"AI & wellbeing",items:[["ai","Predictive Analytics","/admin/predictive"],["people","Behavioural Records","/admin/behavioral"],["people","Student Wellbeing","/admin/wellbeing"]]},
 {label:"Academics & transport",items:[["cbt","CBT Exams","/admin/cbt"],["bus","Driver & Bus Tracking","/admin/transport"]]},
 {label:"School operations",items:[["book","Library","/admin/library"],["bus","Transport Setup","/admin/transport"],["people","Visitors","/admin/visitors"],["finance","Inventory","/admin/inventory"],["calendar","Substitutions","/admin/substitutions"]]},
 {label:"Documents & system",items:[["book","ID Cards","/admin/id-cards"],["book","Certificates","/admin/certificates"],["message","Complaints","/admin/complaints"],["book","Admission Register","/admin/register-import"],["book","Bulk Upload","/admin/bulk-upload"],["people","Manage Users","/admin/users"],["book","Policy Documents","/admin/policies"],["book","All Documents","/admin/documents"],["settings","School Settings","/admin/settings"]]},
] as const;
const portals=[["Staff Portal","/staff"],["Student Portal","/student"],["Parent Portal","/parent"],["Driver Portal","/driver"]] as const;

const adminIconMap: Record<string, LucideIcon> = {
  "Dashboard": LayoutDashboard,
  "Analytics": BarChart3,
  "Activity Logs": Activity,
  "Students": GraduationCap,
  "Staff": BriefcaseBusiness,
  "Pending Approvals": UserCheck,
  "Fee Management": WalletCards,\n  "Fee Setup": WalletCards,\n  "Finance Dashboard": WalletCards,\n  "Finance Reports": FileSpreadsheet,
  "Invoices & Receipts": Receipt,
  "Message Templates": Mail,
  "Financial Intelligence": ChartPie,
  "Announcements": Megaphone,
  "Reports & Export": FileSpreadsheet,
  "Predictive Analytics": Sparkles,
  "Behavioural Records": ClipboardPenLine,
  "Student Wellbeing": HeartPulse,
  "CBT Exams": MonitorPlay,
  "Driver & Bus Tracking": BusFront,
  "Library": LibraryBig,
  "Transport Setup": Route,
  "Visitors": DoorOpen,
  "Inventory": Boxes,
  "Substitutions": ArrowLeftRight,
  "ID Cards": ContactRound,
  "Certificates": Award,
  "Complaints": MessageSquareWarning,
  "Admission Register": ListChecks,
  "Bulk Upload": Upload,
  "Manage Users": Users,
  "Policy Documents": ScrollText,
  "All Documents": Files,
  "School Settings": Settings2,
};

const portalIconMap: Record<string, LucideIcon> = {
  "Staff Portal": UserCog,
  "Student Portal": School,
  "Parent Portal": House,
  "Driver Portal": BusFront,
};

const AdminNavIcon = ({ label, portal = false }: { label: string; portal?: boolean }) => {
  const Icon = portal ? portalIconMap[label] : adminIconMap[label];
  return <Icon className="h-5 w-5" strokeWidth={1.8} />;
};

export const AdminLayout=({children,title}:AdminLayoutProps)=>{
 const [open,setOpen]=useState(false); const {signOut,teacherData}=useAuth(); useRealtimeNotifications(); const nav=useNavigate(); const loc=useLocation();
 const name=teacherData?`${teacherData.first_name} ${teacherData.last_name}`:"Admin"; const initials=name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
 const active=(href:string)=>loc.pathname===href||loc.pathname.startsWith(href+"/"); const logout=async()=>{await signOut();nav("/login");}; const openPortal=(p:string)=>window.open(window.location.origin+p,"_blank");
 const Nav=({close}:{close?:()=>void})=><div className="space-y-6">{sections.map(s=><section key={s.label}><p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/38">{s.label}</p><div className="space-y-1">{s.items.map(([,label,href])=><Link key={href+label} to={href} onClick={close} className={cn("group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[12px] font-semibold transition-all",active(href)?"bg-white text-[hsl(var(--navy))] shadow-lg":"text-white/70 hover:bg-white/10 hover:text-white")}><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl",active(href)?"bg-[#e7f0e8] text-[#3f6d4f]":"bg-white/8 text-white/75")}><AdminNavIcon label={label}/></span><span className="flex-1 truncate">{label}</span>{active(href)&&<ChevronRight className="h-4 w-4"/>}</Link>)}</div></section>)}<section><p className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-white/38">Open portals</p><div className="grid grid-cols-2 gap-2">{portals.map(([label,path])=><button key={path} onClick={()=>{openPortal(path);close?.()}} className="group rounded-2xl border border-white/10 bg-white/7 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/12"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/8 text-white/80"><AdminNavIcon label={label} portal/></span><span className="mt-2 block text-[10px] font-bold text-white/85">{label}</span><ExternalLink className="mt-1 h-3 w-3 text-white/35"/></button>)}</div></section></div>;
 return <div className="min-h-screen bg-background portal-page-bg"><MobileHeader title={title||"Admin Portal"} onMenuClick={()=>setOpen(true)}/><Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="w-[90%] max-w-sm border-0 bg-[hsl(var(--navy))] p-0 text-white"><SheetHeader className="border-b border-white/10 p-5 text-left"><div className="flex items-center gap-3"><img src={npsLogo} className="h-9 w-auto" alt="Imagemakers"/><SheetTitle className="text-white">Command Centre</SheetTitle></div></SheetHeader><nav className="h-[calc(100%-7rem)] overflow-y-auto p-4"><Nav close={()=>setOpen(false)}/></nav><button onClick={logout} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 border-t border-white/10 py-4 text-sm font-semibold text-white/70"><LogOut className="h-4 w-4"/>Sign out</button></SheetContent></Sheet><div className="hidden min-h-screen md:flex"><aside className="sticky top-0 flex h-screen w-[305px] shrink-0 flex-col overflow-hidden bg-[hsl(var(--navy))] p-4 text-white shadow-2xl"><div className="mb-5 flex items-center gap-3 rounded-3xl bg-white/8 p-4"><img src={npsLogo} className="h-10 w-auto" alt="Imagemakers"/><div><p className="portal-display text-base font-bold">Imagemakers</p><p className="text-[10px] text-white/50">School command centre</p></div></div><div className="mb-4 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/6 p-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-white to-white/70 text-primary font-black">{initials}</div><div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="text-[10px] text-white/50">Super Admin</p></div></div><nav className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin"><Nav/></nav><button onClick={logout} className="mt-3 flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/12 hover:text-white"><LogOut className="h-4 w-4"/>Sign out</button></aside><main className="min-w-0 flex-1 overflow-y-auto"><header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-border/50 bg-card/75 px-6 backdrop-blur-2xl lg:px-9"><div><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-primary">Imagemakers • 2026/27</p><h1 className="portal-display text-xl font-bold">{title||"Dashboard"}</h1></div><div className="flex items-center gap-2"><ThemeToggle/><NotificationDropdown/></div></header><div className="mx-auto w-full max-w-[1600px] p-6 lg:p-9">{children}</div></main></div><div className="px-3 pb-6 md:hidden">{children}</div></div>;
};