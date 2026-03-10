import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MobileHeader } from "./MobileHeader";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import npsLogo from "@/assets/nps-logo.png";
import { 
  LayoutDashboard, Users, BookOpen, ClipboardCheck, FileText,
  UserPlus, LogOut, Search, BarChart2, Monitor, User
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { cn } from "@/lib/utils";

interface StaffLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

const teacherNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/staff" },
  { icon: Users, label: "Students", href: "/staff/students" },
  { icon: BookOpen, label: "Classes", href: "/staff/classes" },
  { icon: ClipboardCheck, label: "Attendance", href: "/staff/attendance" },
  { icon: FileText, label: "Gradebook", href: "/staff/gradebook" },
  { icon: Monitor, label: "CBT Exams", href: "/staff/cbt" },
  { icon: BarChart2, label: "Reports", href: "/staff/reports" },
  { icon: UserPlus, label: "Admissions", href: "/staff/admissions" },
  { icon: User, label: "My Profile", href: "/staff/profile" },
];

export const StaffLayout = ({ 
  children, title, showSearch = false, searchPlaceholder = "Search..."
}: StaffLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, teacherData, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const staffName = teacherData ? `${teacherData.first_name} ${teacherData.last_name}` : "Staff";
  const staffInitials = teacherData ? `${teacherData.first_name[0]}${teacherData.last_name[0]}` : "ST";

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="space-y-1">
      {teacherNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-4 border-primary-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={title || "Staff Portal"} onMenuClick={() => setSidebarOpen(true)} showSearch={showSearch} searchPlaceholder={searchPlaceholder} />

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-primary border-r-0">
          <SheetHeader className="p-6">
            <div className="flex items-center gap-3">
              <img src={npsLogo} alt="NPS" className="h-8 w-auto" />
              <SheetTitle className="text-primary-foreground text-lg">NPS Portal</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-5rem)]">
            <div className="px-4 pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="border-2 border-primary-foreground/20">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">{staffInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-foreground truncate text-sm">{staffName}</p>
                  <Badge variant="secondary" className="text-xs capitalize bg-accent text-accent-foreground">{userRole || "Staff"}</Badge>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
              <SidebarNav onItemClick={() => setSidebarOpen(false)} />
            </nav>
            <div className="p-4 border-t border-sidebar-border">
              <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-3" /> Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex h-screen w-full overflow-hidden">
        <aside className="w-[260px] bg-primary flex flex-col shrink-0">
          <div className="p-5 flex items-center gap-3">
            <img src={npsLogo} alt="NPS" className="h-8 w-auto" />
            <span className="text-lg font-bold text-primary-foreground">NPS Portal</span>
          </div>

          <div className="px-4 pb-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-sm">{staffInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary-foreground truncate text-sm">{staffName}</p>
                <Badge variant="secondary" className="text-xs capitalize bg-accent text-accent-foreground">{userRole || "Staff"}</Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
            <p className="text-xs font-semibold text-primary-foreground/40 uppercase tracking-wider mb-3 px-4">Menu</p>
            <SidebarNav />
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" /> Sign Out
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              {title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}
            </div>
            <div className="flex items-center gap-4">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={searchPlaceholder} className="pl-10 w-64 rounded-md" />
                </div>
              )}
              <NotificationDropdown />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>

      <div className="md:hidden">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
