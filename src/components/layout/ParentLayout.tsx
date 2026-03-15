import { ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { MobileHeader } from "./MobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import npsLogo from "@/assets/nps-logo.png";
import {
  LayoutDashboard, BookOpen, Calendar, CreditCard, MessageSquare,
  MessagesSquare, LogOut
} from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { cn } from "@/lib/utils";

interface ParentLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/parent" },
  { icon: BookOpen, label: "Child's Grades", href: "/parent/grades" },
  { icon: Calendar, label: "Attendance", href: "/parent/attendance" },
  { icon: CreditCard, label: "Fees", href: "/parent/fees" },
  { icon: MessageSquare, label: "Messages", href: "/parent/messages" },
  { icon: MessagesSquare, label: "Forum", href: "/parent/forum" },
];

export const ParentLayout = ({ children, title }: ParentLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const parentName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`
    : "Parent";
  const initials = parentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

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
            <Icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title={title || "Parent Portal"} onMenuClick={() => setSidebarOpen(true)} />
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-primary border-r-0">
          <SheetHeader className="p-6">
            <div className="flex items-center gap-3">
              <img src={npsLogo} alt="NPS" className="h-8 w-auto" />
              <SheetTitle className="text-primary-foreground text-lg">Parent Portal</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-5rem)]">
            <div className="px-4 pb-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <Avatar className="border-2 border-primary-foreground/20">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary-foreground truncate text-sm">{parentName}</p>
                  <Badge className="text-xs bg-accent text-accent-foreground">Parent</Badge>
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
            <span className="text-lg font-bold text-primary-foreground">Parent Portal</span>
          </div>
          <div className="px-4 pb-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary-foreground truncate text-sm">{parentName}</p>
                <Badge className="text-xs bg-accent text-accent-foreground">Parent</Badge>
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
            <div>{title && <h1 className="text-xl font-bold text-foreground">{title}</h1>}</div>
            <NotificationDropdown />
          </header>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <div className="md:hidden"><div className="p-4">{children}</div></div>
    </div>
  );
};
