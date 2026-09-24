import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, ClipboardList, CalendarDays, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  href: string;
}

const studentNavItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: GraduationCap, label: "Results", href: "/student/grades" },
  { icon: ClipboardList, label: "Reports", href: "/student/reports" },
  { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
  { icon: UserCircle, label: "Profile", href: "/student/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#dfe6e1] bg-[#fbfaf6]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_-28px_rgba(40,65,48,.7)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-[72px] max-w-md items-center justify-around gap-1">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || (item.href !== "/student" && location.pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[10px] font-extrabold transition-all",
                isActive ? "text-[#3f6d4f]" : "text-[#7c857f] hover:text-[#3f6d4f]"
              )}
            >
              {isActive && <span className="absolute top-1 h-1 w-8 rounded-full bg-[#4f8063]" />}
              <span className={cn(
                "grid h-9 w-9 place-items-center rounded-xl transition-all",
                isActive ? "bg-[#e7f0e8] shadow-sm" : "bg-transparent"
              )}>
                <Icon className="h-[19px] w-[19px]" strokeWidth={isActive ? 2.25 : 1.8} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
