import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Material 3 kit for the student portal home screen.
 * Tonal surfaces, state layers, restrained elevation, expressive typography.
 */

/* ---------- layout ---------- */

export const M3Section = ({
  label,
  action,
  href,
  actionLabel = "View all",
  children,
  className,
}: {
  label?: string;
  action?: ReactNode;
  href?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("animate-m3-rise", className)}>
    {(label || href || action) && (
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        {label && <h2 className="m3-label uppercase">{label}</h2>}
        {action ??
          (href ? (
            <Link
              to={href}
              className="m3-press -mr-2 flex items-center gap-0.5 rounded-full px-2 py-1 text-[12px] font-semibold text-primary"
            >
              {actionLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : null)}
      </div>
    )}
    {children}
  </section>
);

/** Tonal container — the default grouping surface (no heavy white card). */
export const M3Surface = ({
  children,
  className,
  tone = "container",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  tone?: "container" | "low" | "high" | "card";
  as?: any;
}) => (
  <As
    className={cn(
      "rounded-[20px]",
      tone === "container" && "bg-surface-container",
      tone === "low" && "bg-surface-container-low",
      tone === "high" && "bg-surface-container-high",
      tone === "card" && "border border-border/50 bg-card shadow-elev-1",
      className,
    )}
  >
    {children}
  </As>
);

/* ---------- metrics ---------- */

export const M3Metric = ({
  value,
  unit,
  label,
  note,
  tone = "default",
}: {
  value: ReactNode;
  unit?: string;
  label: string;
  note?: string;
  tone?: "default" | "primary" | "success" | "warning" | "error";
}) => (
  <div className="px-4 py-3.5">
    <p
      className={cn(
        "num font-display text-[26px] font-semibold leading-none tracking-tight",
        tone === "default" && "text-foreground",
        tone === "primary" && "text-primary",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "error" && "text-destructive",
      )}
    >
      {value}
      {unit && <span className="ml-0.5 align-baseline text-[15px] font-medium opacity-70">{unit}</span>}
    </p>
    <p className="mt-1.5 text-[12.5px] font-medium text-foreground/85">{label}</p>
    {note && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{note}</p>}
  </div>
);

/* ---------- progress ---------- */

export const M3Progress = ({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "success" | "warning" | "error";
  className?: string;
}) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn("flex h-2.5 items-center gap-1 overflow-hidden rounded-full bg-foreground/[0.07]", className)}
  >
    <span
      className={cn(
        "animate-m3-bar h-full rounded-full transition-[width] duration-700 ease-out",
        tone === "primary" && "bg-primary",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-warning",
        tone === "error" && "bg-destructive",
      )}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

/* ---------- rows ---------- */

export const M3Row = ({
  icon: Icon,
  tone = "primary",
  title,
  subtitle,
  trailing,
  href,
  className,
}: {
  icon?: any;
  tone?: "primary" | "success" | "warning" | "error" | "neutral";
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  className?: string;
}) => {
  const body = (
    <div className={cn("flex items-center gap-3 px-4 py-3", className)}>
      {Icon && (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            tone === "primary" && "bg-primary-container text-primary-container-foreground",
            tone === "success" && "bg-success-container text-success-container-foreground",
            tone === "warning" && "bg-warning-container text-warning-container-foreground",
            tone === "error" && "bg-error-container text-error-container-foreground",
            tone === "neutral" && "bg-foreground/[0.06] text-foreground/70",
          )}
        >
          <Icon className="h-[19px] w-[19px]" strokeWidth={2} aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-foreground">{title}</p>
        {subtitle && <p className="truncate text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing ?? (href ? <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted-foreground/70" aria-hidden /> : null)}
    </div>
  );
  if (href)
    return (
      <Link to={href} className="m3-state m3-press block min-h-[56px] rounded-[20px]">
        {body}
      </Link>
    );
  return body;
};

/* ---------- action chips ---------- */

export const M3ActionRail = ({ children }: { children: ReactNode }) => (
  <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
    {children}
  </div>
);

export const M3Action = ({
  icon: Icon,
  label,
  href,
  badge,
}: {
  icon: any;
  label: string;
  href: string;
  badge?: number;
}) => (
  <Link
    to={href}
    className="m3-state m3-press flex min-h-12 shrink-0 snap-start items-center gap-2 rounded-full bg-surface-container-high px-4 py-2.5"
  >
    <span className="relative">
      <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} aria-hidden />
      {!!badge && (
        <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">
          {badge}
        </span>
      )}
    </span>
    <span className="whitespace-nowrap text-[13px] font-medium text-foreground">{label}</span>
  </Link>
);
