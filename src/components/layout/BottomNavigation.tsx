import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, ClipboardList, CalendarDays, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const studentNavItems = [
  { icon: Home, label: "Home", href: "/student" },
  { icon: GraduationCap, label: "Results", href: "/student/grades" },
  { icon: ClipboardList, label: "Reports", href: "/student/reports" },
  { icon: CalendarDays, label: "Schedule", href: "/student/schedule" },
  { icon: UserCircle, label: "Profile", href: "/student/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  return (
    <nav className="student-liquid-nav fixed bottom-3 left-1/2 z-[60] w-[calc(100%-20px)] max-w-md -translate-x-1/2 md:hidden">
      <div className="flex h-[68px] items-center justify-around gap-1 rounded-[26px] border border-white/70 bg-white/72 px-2 shadow-[0_18px_55px_-24px_rgba(22,125,183,.65)] backdrop-blur-2xl">
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.href || (item.href !== "/student" && location.pathname.startsWith(item.href + "/"));
          return (
            <Link key={item.href} to={item.href} className={cn("relative flex h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[19px] text-[10px] font-black transition-all", active ? "bg-[#e5f5fd] text-[#167db7] shadow-sm" : "text-[#6f8795] hover:bg-[#f1f9fd]")}>
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.7}/>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
