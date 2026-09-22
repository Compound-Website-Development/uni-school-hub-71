import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import npsLogo from "@/assets/logo";
import {
  Home, BookOpen, FileText, Calendar, User, LogOut, Menu, Bell, ArrowLeft,
  CreditCard, Megaphone, Monitor, ClipboardList, BookOpenCheck,
  CalendarDays, AlertTriangle, Users, Library, ScrollText, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  back?: string;
  studentNameOverride?: string;
  studentIdOverride?: string;
  publicView?: boolean;
}

const navGroups: { heading: string; items: { icon: any; label: string; href: string }[] }[] = [
  {
    heading: "Academics",
    items: [
      { icon: Home, label: "Dashboard", href: "/student" },
      { icon: BookOpen, label: "My Results", href: "/student/grades" },
      { icon: FileText, label: "Report Cards", href: "/student/reports" },
      { icon: ScrollText, label: "Transcript", href: "/student/transcript" },
      { icon: Monitor, label: "CBT Exams", href: "/student/exams" },
      { icon: ClipboardList, label: "Homework", href: "/student/homework" },
      { icon: BookOpenCheck, label: "Learning Hub", href: "/student/learning" },
      { icon: BookOpen, label: "Resources", href: "/student/resources" },
      { icon: Library, label: "Library", href: "/student/library" },
    ],
  },
  {
    heading: "School life",
    items: [
      { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
      { icon: Calendar, label: "Attendance", href: "/student/attendance" },
      { icon: CalendarDays, label: "Calendar", href: "/student/calendar" },
      { icon: Megaphone, label: "Announcements", href: "/student/announcements" },
      { icon: Users, label: "Community Wall", href: "/student/wall" },
      { icon: AlertTriangle, label: "Complaints", href: "/student/complaints" },
    ],
  },
  {
    heading: "Account",
    items: [
      { icon: CreditCard, label: "Fee Payments", href: "/student/fees" },
      { icon: User, label: "My Profile", href: "/student/profile" },
      { icon: Settings, label: "Settings", href: "/student/settings" },
    ],
  },
];

const bottomNavItems = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: BookOpen, label: "Grades", href: "/student/grades" },
  { icon: FileText, label: "Reports", href: "/student/reports" },
  { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
  { icon: User, label: "Profile", href: "/student/profile" },
];

export const StudentLayout = ({ children, title, back, studentNameOverride, studentIdOverride, publicView = false }: StudentLayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { signOut, studentData } = useAuth();
  useRealtimeNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const studentName = studentNameOverride || (studentData ? `${studentData.first_name} ${studentData.last_name}` : "Student");
  const studentInitials = studentData
    ? `${studentData.first_name?.[0] || ""}${studentData.last_name?.[0] || ""}`
    : "ST";

  const isActive = (href: string) =>
    location.pathname === href || (href !== "/student" && location.pathname.startsWith(href + "/"));

  const NavList = ({ onItemClick, dark }: { onItemClick?: () => void; dark?: boolean }) => (
    <div className="space-y-5">
      {navGroups.map((group) => (
        <div key={group.heading}>
          <p className={cn("mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.16em]", dark ? "text-foreground/40" : "text-muted-foreground")}>
            {group.heading}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.label}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "press flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] transition-colors",
                    active
                      ? "bg-primary/10 font-bold text-primary"
                      : "font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={active ? 2.3 : 1.9} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header — app bar: back/menu, coloured title, bell */}
      <header className="md:hidden sticky top-0 z-40 border-b border-border/60 bg-card/90 backdrop-blur-xl safe-top">
        <div className="flex h-14 items-center gap-2 px-3">
          {back ? (
            <Link to={back} className="press tap-target grid h-10 w-10 place-items-center rounded-xl text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={() => setDrawerOpen(true)}
              className="press tap-target grid h-10 w-10 place-items-center rounded-xl text-primary"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-display min-w-0 flex-1 truncate text-[19px] font-extrabold tracking-tight text-primary">
            {title || "Student"}
          </h1>
          <ThemeToggle />
          <Link
            to="/student/announcements"
            className="press tap-target relative grid h-10 w-10 place-items-center rounded-xl text-primary"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          </Link>
        </div>
      </header>

      {/* Drawer — plain grouped text list */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[86%] max-w-sm border-r border-foreground/15 bg-background p-0">
          <SheetHeader className="border-b border-foreground/15 px-5 py-5 text-left">
            <SheetTitle className="font-display text-xl font-bold tracking-tight text-foreground">
              Student Portal
            </SheetTitle>
            <p className="truncate text-sm text-muted-foreground">{studentName}</p>
          </SheetHeader>
          <nav className="h-[calc(100%-9.5rem)] overflow-y-auto px-5 py-5 scrollbar-thin">
            <NavList onItemClick={() => setDrawerOpen(false)} />
          </nav>
          <div className="border-t border-foreground/15 px-5 py-4">
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop — editorial sidebar */}
      <div className="hidden h-screen w-full overflow-hidden md:flex">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-foreground/15 bg-background">
          <div className="flex items-center gap-3 border-b border-foreground/15 px-5 py-5">
            <img src={npsLogo} alt="Imagemakers" className="h-8 w-auto" />
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-bold text-foreground">Student Portal</p>
              <p className="num truncate text-[11px] text-muted-foreground">{studentIdOverride || studentData?.student_id || studentName}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin"><NavList /></nav>
          <div className="border-t border-foreground/15 px-5 py-4">
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-5xl p-8 lg:p-10">{children}</div>
        </main>
      </div>

      {/* Mobile content */}
      <div className="md:hidden pb-28"><div className="px-4 pt-4">{children}</div></div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-elev-3 safe-bottom md:hidden">
        <div className="flex h-[64px] items-stretch px-1">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="press relative flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-all duration-300",
                    active ? "bg-primary/12 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none transition-colors",
                    active ? "font-bold text-primary" : "font-medium text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
