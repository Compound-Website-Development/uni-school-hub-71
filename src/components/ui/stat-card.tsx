import { cn } from "@/lib/utils";
import { 
  Users, BookOpen, ClipboardList, UserPlus, TrendingUp, TrendingDown,
  GraduationCap, CreditCard, Bell, Calendar, FileText, BarChart2,
  CheckCircle, Clock, AlertTriangle, XCircle, type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  group: Users,
  book: BookOpen,
  assignment: ClipboardList,
  person_add: UserPlus,
  graduation_cap: GraduationCap,
  credit_card: CreditCard,
  bell: Bell,
  calendar: Calendar,
  file_text: FileText,
  bar_chart: BarChart2,
  check_circle: CheckCircle,
  clock: Clock,
  alert: AlertTriangle,
  x_circle: XCircle,
};

interface StatCardProps {
  icon: string | LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "bg-secondary text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export const StatCard = ({
  icon,
  label,
  value,
  trend,
  variant = "default",
  className,
}: StatCardProps) => {
  const IconComponent = typeof icon === "string" ? iconMap[icon] || Users : icon;

  return (
    <div className={cn("bg-card rounded-xl border border-border/50 p-5 card-hover-subtle shadow-card", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-lg", variantStyles[variant])}>
          <IconComponent className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1",
              trend.isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
};
