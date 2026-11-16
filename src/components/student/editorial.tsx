import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Student portal app kit — native-app card language.
 * Soft white cards on a tinted canvas, tinted icon squares, pill states.
 * (Export names kept stable so every student page inherits the new look.)
 */

/* ---------------- surfaces ---------------- */

export const AppCard = ({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-border/60 bg-card shadow-elev-1 transition-shadow duration-300 hover:shadow-elev-2",
      padded && "p-4",
      className,
    )}
  >
    {children}
  </div>
);

export const IconBadge = ({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: any;
  tone?: "primary" | "success" | "warning" | "destructive" | "accent" | "muted";
  className?: string;
}) => (
  <span
    className={cn(
      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
      tone === "primary" && "bg-primary/10 text-primary",
      tone === "success" && "bg-success/10 text-success",
      tone === "warning" && "bg-warning/15 text-warning",
      tone === "destructive" && "bg-destructive/10 text-destructive",
      tone === "accent" && "bg-accent/15 text-accent",
      tone === "muted" && "bg-muted text-muted-foreground",
      className,
    )}
  >
    <Icon className="h-5 w-5" />
  </span>
);

/* ---------------- headers ---------------- */

export const PageTitle = ({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) => (
  <header className="animate-fade-up">
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="editorial-eyebrow">{eyebrow}</p>}
        <h1 className="font-display mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {lede && <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted-foreground">{lede}</p>}
      </div>
      {action}
    </div>
  </header>
);

export const SectionHeader = ({
  title,
  href,
  hrefLabel = "View All",
  right,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  right?: ReactNode;
}) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h2 className="font-display text-[15px] font-bold tracking-tight text-foreground">{title}</h2>
    {right ??
      (href ? (
        <Link
          to={href}
          className="press flex items-center gap-0.5 text-xs font-bold text-primary transition-opacity hover:opacity-80"
        >
          {hrefLabel} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null)}
  </div>
);

/* ---------------- figures ---------------- */

const figureTone = ["text-primary", "text-success", "text-warning", "text-foreground"];

export const Figure = ({
  value,
  unit,
  caption,
  note,
  className,
  index = 0,
}: {
  value: ReactNode;
  unit?: string;
  caption: string;
  note?: string;
  className?: string;
  index?: number;
}) => (
  <div className={cn("px-3 py-4 text-center", className)}>
    <p className={cn("font-display num text-[26px] font-extrabold leading-none tracking-tight", figureTone[index % 4])}>
      {value}
      {unit && <span className="ml-0.5 text-sm font-bold opacity-70">{unit}</span>}
    </p>
    <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{caption}</p>
    {note && <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">{note}</p>}
  </div>
);

export const FigureGrid = ({ children }: { children: ReactNode }) => (
  <AppCard padded={false} className="animate-fade-up overflow-hidden">
    <div className="grid grid-cols-2 divide-x divide-y divide-border/60 md:grid-cols-4 md:divide-y-0">
      {children}
    </div>
  </AppCard>
);

/* ---------------- states ---------------- */

export const StatusWord = ({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: "muted" | "ink" | "alert" | "accent" | "success";
  className?: string;
}) => (
  <span
    className={cn(
      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
      tone === "muted" && "bg-muted text-muted-foreground",
      tone === "ink" && "bg-foreground/10 text-foreground",
      tone === "alert" && "bg-destructive/10 text-destructive",
      tone === "accent" && "bg-primary/10 text-primary",
      tone === "success" && "bg-success/10 text-success",
      className,
    )}
  >
    {label}
  </span>
);

/* ---------------- tabs ---------------- */

export const UnderlineTabs = <T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: NoInfer<T>; label: string }[];
  className?: string;
}) => (
  <div
    className={cn(
      "flex gap-1 overflow-x-auto rounded-full border border-border/60 bg-card p-1 shadow-elev-1 scrollbar-none",
      className,
    )}
  >
    {options.map((o) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "press shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all duration-200",
            active ? "bg-primary text-primary-foreground shadow-btn" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

/* ---------------- lists ---------------- */

/** Card-wrapped, divider separated list. */
export const RuleList = ({ children, className }: { children: ReactNode; className?: string }) => (
  <AppCard padded={false} className={cn("animate-fade-up overflow-hidden", className)}>
    <ul className="divide-y divide-border/60 [&>li]:px-4">{children}</ul>
  </AppCard>
);

/** Tappable row with an icon, title, subtitle and chevron (settings/menu style). */
export const ListRow = ({
  icon,
  tone = "primary",
  title,
  subtitle,
  right,
  href,
  onClick,
}: {
  icon?: any;
  tone?: "primary" | "success" | "warning" | "destructive" | "accent" | "muted";
  title: string;
  subtitle?: string;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
}) => {
  const inner = (
    <div className="flex items-center gap-3 py-3.5">
      {icon && <IconBadge icon={icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-foreground">{title}</p>
        {subtitle && <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />}
    </div>
  );
  if (href) return <Link to={href} className="press block active:bg-muted/40">{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="press block w-full text-left active:bg-muted/40">{inner}</button>;
  return inner;
};

/* ---------------- tiles ---------------- */

export const TileGroup = ({ title, children }: { title?: string; children: ReactNode }) => (
  <AppCard className="animate-fade-up">
    {title && <h2 className="font-display mb-3 text-[15px] font-bold tracking-tight text-foreground">{title}</h2>}
    <div className="grid grid-cols-3 gap-2">{children}</div>
  </AppCard>
);

export const Tile = ({
  icon: Icon,
  label,
  href,
  tone = "primary",
  badge,
}: {
  icon: any;
  label: string;
  href: string;
  tone?: "primary" | "success" | "warning" | "destructive" | "accent" | "muted";
  badge?: string | number;
}) => (
  <Link
    to={href}
    className="press group flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition-colors hover:bg-muted/50"
  >
    <span className="relative">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "success" && "bg-success/10 text-success",
          tone === "warning" && "bg-warning/15 text-warning",
          tone === "destructive" && "bg-destructive/10 text-destructive",
          tone === "accent" && "bg-accent/15 text-accent",
          tone === "muted" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
      </span>
      {badge !== undefined && badge !== 0 && badge !== "" && (
        <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-elev-1">
          {badge}
        </span>
      )}
    </span>
    <span className="text-center text-[11px] font-semibold leading-tight text-foreground">{label}</span>
  </Link>
);

/* ---------------- empty ---------------- */

export const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
  <AppCard className="animate-fade-in py-10 text-center">
    <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
      <Inbox className="h-6 w-6" />
    </span>
    <p className="font-display text-[15px] font-bold text-foreground">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">{hint}</p>}
  </AppCard>
);
