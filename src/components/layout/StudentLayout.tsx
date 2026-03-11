import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import npsLogo from "@/assets/nps-logo.png";
import {
  Home, BookOpen, FileText, Calendar, User, LogOut, Menu, Bell,
  CreditCard, Megaphone, Monitor, ClipboardList, BookOpenCheck,
  CalendarDays, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { icon: Home, label: "Dashboard", href: "/student" },
  { icon: BookOpen, label: "My Results", href: "/student/grades" },
  { icon: Calendar, label: "Attendance", href: "/student/attendance" },
  { icon: FileText, label: "Reports", href: "/student/reports" },
  { icon: CreditCard, label: "Fee Payments", href: "/student/fees" },
  { icon: Megaphone, label: "Announcements", href: "/student/announcements" },
  { icon: Monitor, label: "CBT Exams", href: "/student/exams" },
  { icon: ClipboardList, label: "Homework", href: "/student/homework" },
  { icon: BookOpenCheck, label: "Library", href: "/student/library" },
  { icon: CalendarDays, label: "Calendar", href: "/student/calendar" },
  { icon: AlertTriangle, label: "Complaints", href: "/student/complaints" },
  { icon: User, label: "My Profile", href: "/student/settings" },
];

export const StudentLayout = ({ children, title }: StudentLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student";
  const studentInitials = studentData ? `${studentData.first_name?.[0] || ''}${studentData.last_name?.[0] || ''}` : "ST";

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} to={item.href} onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-4 border-primary-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
            <Icon className="w-5 h-5 shrink-0" /><span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border/50 safe-top">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"><Menu className="w-6 h-6 text-foreground" /></button>
          <div className="flex items-center gap-2"><img src={npsLogo} alt="NPS" className="h-8 w-auto" /></div>
          <button className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" /><span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-primary border-r-0">
          <SheetHeader className="p-6">
            <div className="flex items-center gap-3">
              <img src={npsLogo} alt="NPS" className="h-8 w-auto" />
              <SheetTitle className="text-primary-foreground text-lg">Student Portal</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-5rem)]">
            <div className="px-4 pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="border-2 border-primary-foreground/20">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">{studentInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-foreground truncate text-sm">{studentName}</p>
                  <Badge className="text-xs bg-accent text-accent-foreground">Student</Badge>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto"><SidebarNav onItemClick={() => setSidebarOpen(false)} /></nav>
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
            <span className="text-lg font-bold text-primary-foreground">Student Portal</span>
          </div>
          <div className="px-4 pb-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-sm">{studentInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary-foreground truncate text-sm">{studentName}</p>
                <p className="text-xs text-primary-foreground/60 truncate">{studentData?.student_id || "Student"}</p>
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
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-8 max-w-6xl">{children}</div>
        </main>
      </div>
      <div className="md:hidden pt-16 pb-20"><div className="p-4">{children}</div></div>
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-card rounded-2xl shadow-lg border border-border/50 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href} className={cn("flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 rounded-xl", isActive ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("p-2 rounded-xl transition-all duration-200", isActive && "bg-primary/10")}>
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                </div>
                <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
