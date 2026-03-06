import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import npsLogo from "@/assets/nps-logo.png";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  userType: "student" | "teacher" | "admin";
  userName: string;
  userSubtitle: string;
  onLogout?: () => void;
}

export const Sidebar = ({ navItems, userType, userName, userSubtitle, onLogout }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside className="w-[260px] bg-primary flex flex-col h-full flex-shrink-0 transition-colors">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <img src={npsLogo} alt="NPS" className="h-8 w-auto" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-primary-foreground">NPS Portal</h1>
          <p className="text-primary-foreground/50 text-xs capitalize">{userType} Access</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-4 border-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive && "filled")}>{item.icon}</span>
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-primary-foreground/60 hover:text-primary-foreground hover:bg-sidebar-accent transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
        
        <div className="mt-4 flex items-center gap-3 px-4">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold">
            {userName.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-primary-foreground truncate">{userName}</span>
            <span className="text-xs text-primary-foreground/50 truncate">{userSubtitle}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
