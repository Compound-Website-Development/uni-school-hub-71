import { cn } from "@/lib/utils";

export const PortalHeroArt = ({ variant = "school" }: { variant?: "school" | "learning" | "operations" | "family" }) => {
  const accent = variant === "family" ? "hsl(var(--accent))" : "hsl(var(--primary))";
  return (
    <div className={cn("portal-hero-art pointer-events-none select-none", "portal-hero-art-" + variant)} aria-hidden="true">
      <svg viewBox="0 0 420 260" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={accent} stopOpacity=".55" />
            <stop offset="1" stopColor="hsl(var(--navy))" stopOpacity=".08" />
          </linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="18" /></filter>
        </defs>
        <circle cx="330" cy="45" r="72" fill="url(#heroGlow)" filter="url(#blur)" />
        <path d="M28 210C72 164 103 175 139 196C174 216 206 226 246 193C282 163 319 165 392 211" stroke={accent} strokeOpacity=".28" strokeWidth="2" />
        <rect x="92" y="70" width="190" height="118" rx="24" fill="hsl(var(--card))" fillOpacity=".72" stroke="hsl(var(--border))" />
        <rect x="116" y="92" width="142" height="8" rx="4" fill={accent} fillOpacity=".22" />
        <rect x="116" y="112" width="96" height="7" rx="3.5" fill="hsl(var(--muted-foreground))" fillOpacity=".18" />
        <rect x="116" y="138" width="54" height="28" rx="10" fill={accent} fillOpacity=".16" />
        <rect x="181" y="138" width="77" height="28" rx="10" fill="hsl(var(--navy))" fillOpacity=".08" />
        <circle cx="57" cy="77" r="18" fill={accent} fillOpacity=".13" />
        <path d="M49 77l6 6 11-13" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="335" cy="150" r="27" fill={accent} fillOpacity=".12" />
        <path d="M323 151h24M335 139v24" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M308 212c15-17 32-26 49-26 20 0 35 10 48 26" stroke={accent} strokeWidth="2" strokeOpacity=".25" strokeLinecap="round" />
      </svg>
    </div>
  );
};
