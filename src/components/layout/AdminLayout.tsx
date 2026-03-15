import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { MobileHeader } from "./MobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import npsLogo from "@/assets/nps-logo.png";
import {
  LayoutDashboard, Users, GraduationCap, Briefcase, ShieldCheck,
  CreditCard, Megaphone, Settings, LogOut, Search, BarChart2,
  Activity, Upload, Database, ExternalLink, BookOpen, Bus,
  UserCheck, CreditCard as IdCard, Award, AlertTriangle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/NotificationDropdown";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

const adminNavSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: BarChart2, label: "Analytics", href: "/admin/analytics" },
      { icon: Activity, label: "Activity Logs", href: "/admin/activity" },
    ],
  },
  {
    label: "People",
    items: [
      { icon: GraduationCap, label: "Students", href: "/admin/students" },
      { icon: Briefcase, label: "Staff", href: "/admin/staff" },
      { icon: ShieldCheck, label: "Pending Approvals", href: "/admin/approvals" },
    ],
  },
  {
    label: "Finance & Comms",
    items: [
      { icon: CreditCard, label: "Fee Management", href: "/admin/fees" },
      { icon: Megaphone, label: "Announcements", href: "/admin/announcements" },
      { icon: FileText, label: "Reports & Export", href: "/admin/reports" },
    ],
  },
  {
    label: "Facilities",
    items: [
      { icon: BookOpen, label: "Library", href: "/admin/library" },
      { icon: Bus, label: "Transport", href: "/admin/transport" },
      { icon: UserCheck, label: "Visitors", href: "/admin/visitors" },
    ],
  },
  {
    label: "Documents",
    items: [
      { icon: IdCard, label: "ID Cards", href: "/admin/id-cards" },
      { icon: Award, label: "Certificates", href: "/admin/certificates" },
      { icon: AlertTriangle, label: "Complaints", href: "/admin/complaints" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Upload, label: "Bulk Upload", href: "/admin/bulk-upload" },
      { icon: Database, label: "Manage Users", href: "/admin/users" },
      { icon: Settings, label: "School Settings", href: "/admin/settings" },
    ],
  },
];

const portalLinks = [
  { label: "Staff Portal", path: "/staff" },
  { label: "Student Portal", path: "/student" },
];

export const AdminLayout = ({
  children, title, showSearch = false, searchPlaceholder = "Search..."
}: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, teacherData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await signOut(); navigate("/login"); };
  const openPortal = (path: string) => { window.open(window.location.origin + path, "_blank"); };

  const staffName = teacherData ? `${teacherData.first_name} ${teacherData.last_name}` : "Admin";
  const staffInitials = teacherData ? `${teacherData.first_name[0]}${teacherData.last_name[0]}` : "AD";

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="space-y-5">
      {adminNavSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.15em] mb-1.5 px-4">{section.label}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href} onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[13px]",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                  )}>
                  <Icon className="w-4 h-4 shrink-0" /><span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.15em] mb-1.5 px-4">Portals</p>
        <div className="space-y-0.5">
          {portalLinks.map((portal) => (
            <button key={portal.path} onClick={() => { openPortal(portal.path); onItemClick?.(); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[13px] text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 w-full text-left">
              <ExternalLink className="w-4 h-4 shrink-0" /><span>{portal.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={title || "Admin Portal"} onMenuClick={() => setSidebarOpen(true)} showSearch={showSearch} searchPlaceholder={searchPlaceholder} />
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar-background border-r-0">
          <SheetHeader className="p-5">
            <div className="flex items-center gap-3">
              <img src={npsLogo} alt="NPS" className="h-7 w-auto" />
              <SheetTitle className="text-sidebar-foreground text-base">Super Admin</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <div className="px-4 pb-3 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-sidebar-foreground/10">
                  <AvatarFallback className="bg-sidebar-foreground/10 text-sidebar-foreground font-bold text-xs">{staffInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sidebar-foreground truncate text-sm">{staffName}</p>
                  <Badge className="text-[10px] bg-accent/20 text-accent border-0">Super Admin</Badge>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin"><SidebarNav onItemClick={() => setSidebarOpen(false)} /></nav>
            <div className="p-3 border-t border-sidebar-border">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <div className="hidden md:flex h-screen w-full overflow-hidden">
        <aside className="w-[250px] bg-sidebar-background flex flex-col shrink-0 border-r border-sidebar-border">
          <div className="p-4 flex items-center gap-2.5 border-b border-sidebar-border">
            <img src={npsLogo} alt="NPS" className="h-7 w-auto" />
            <div>
              <span className="text-sm font-bold text-sidebar-foreground">NPS Portal</span>
              <p className="text-[10px] text-sidebar-foreground/40">Super Admin</p>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 border border-sidebar-foreground/10">
                <AvatarFallback className="bg-sidebar-foreground/10 text-sidebar-foreground font-bold text-[11px]">{staffInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sidebar-foreground truncate text-xs">{staffName}</p>
                <Badge className="text-[9px] h-4 bg-accent/20 text-accent border-0 px-1.5">Super Admin</Badge>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-2.5 overflow-y-auto scrollbar-thin"><SidebarNav /></nav>
          <div className="p-3 border-t border-sidebar-border">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">{title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}</div>
            <div className="flex items-center gap-3">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={searchPlaceholder} className="pl-9 w-56 h-9 text-sm rounded-md" />
                </div>
              )}
              <NotificationDropdown />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</div>
        </main>
      </div>
      <div className="md:hidden"><div className="p-4">{children}</div></div>
    </div>
  );
};
