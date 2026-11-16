import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { kind?: "home" | "people" | "book" | "attendance" | "cbt" | "bus" | "finance" | "message" | "ai" | "calendar" | "profile" | "settings" };

const common = { viewBox: "0 0 64 64", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true };

export const PortalIconArt = ({ kind = "home", ...props }: Props) => {
  const k = kind;
  return (
    <svg {...common} {...props}>
      <defs>
        <linearGradient id="pgrad" x1="8" y1="8" x2="56" y2="56">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="20" fill="url(#pgrad)" opacity=".12" />
      {k === "home" && <><path d="M18 31 32 18l14 13v15H36V37H28v9H18V31Z" stroke="hsl(var(--primary))" strokeWidth="2.6" strokeLinejoin="round"/><path d="M26 29h12M28 25h8" stroke="hsl(var(--accent))" strokeWidth="2.4" strokeLinecap="round"/></>}
      {k === "people" && <><circle cx="25" cy="26" r="7" fill="hsl(var(--primary)/.16)" stroke="hsl(var(--primary))" strokeWidth="2.4"/><circle cx="43" cy="29" r="5" fill="hsl(var(--accent)/.18)" stroke="hsl(var(--accent))" strokeWidth="2.2"/><path d="M13 48c1.8-8 6-12 12-12s10.2 4 12 12M36 48c.9-5.8 3.8-8.8 8-8.8 3.3 0 5.7 2.2 7 6.8" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/></>}
      {k === "book" && <><path d="M14 17c7-2.5 13-1 18 3v27c-5-4-11-5.5-18-3V17Z" fill="hsl(var(--primary)/.14)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M50 17c-7-2.5-13-1-18 3v27c5-4 11-5.5 18-3V17Z" fill="hsl(var(--accent)/.12)" stroke="hsl(var(--accent))" strokeWidth="2.5"/><path d="M21 24h6M21 30h7M43 24h-6M43 30h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>}
      {k === "attendance" && <><circle cx="32" cy="32" r="18" fill="hsl(var(--success)/.12)" stroke="hsl(var(--success))" strokeWidth="2.5"/><path d="m22 32 7 7 14-16" stroke="hsl(var(--success))" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 10v6M32 48v6" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round"/></>}
      {k === "cbt" && <><rect x="14" y="13" width="36" height="27" rx="6" fill="hsl(var(--primary)/.1)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M22 22h20M22 28h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M24 48h16M29 40v8M35 40v8" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round"/></>}
      {k === "bus" && <><path d="M15 39V24c0-5 5-8 17-8s17 3 17 8v15H15Z" fill="hsl(var(--primary)/.12)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M19 25h26v9H19z" fill="hsl(var(--accent)/.18)" stroke="hsl(var(--accent))" strokeWidth="2"/><circle cx="23" cy="43" r="4" fill="hsl(var(--navy))"/><circle cx="41" cy="43" r="4" fill="hsl(var(--navy))"/><path d="M19 48h26" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/></>}
      {k === "finance" && <><rect x="15" y="18" width="34" height="30" rx="7" fill="hsl(var(--accent)/.12)" stroke="hsl(var(--accent))" strokeWidth="2.5"/><path d="M21 27h22M22 35h8M22 41h13" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/><circle cx="42" cy="40" r="5" fill="hsl(var(--primary)/.16)" stroke="hsl(var(--primary))" strokeWidth="2"/></>}
      {k === "message" && <><path d="M14 18h36v25H28l-9 8v-8h-5V18Z" fill="hsl(var(--primary)/.1)" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round"/><path d="M23 28h18M23 34h11" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round"/></>}
      {k === "ai" && <><rect x="15" y="17" width="34" height="30" rx="10" fill="hsl(var(--primary)/.12)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><circle cx="26" cy="31" r="3" fill="hsl(var(--accent))"/><circle cx="38" cy="31" r="3" fill="hsl(var(--accent))"/><path d="M25 39c4 3 10 3 14 0M32 10v7M28 13l4-3 4 3" stroke="hsl(var(--primary))" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></>}
      {k === "calendar" && <><rect x="14" y="16" width="36" height="34" rx="7" fill="hsl(var(--primary)/.1)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M14 25h36M23 12v8M41 12v8" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round"/><path d="M23 32h.1M32 32h.1M41 32h.1M23 40h.1M32 40h.1" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></>}
      {k === "profile" && <><circle cx="32" cy="25" r="9" fill="hsl(var(--primary)/.12)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M16 49c2.5-9 7.8-13 16-13s13.5 4 16 13" fill="hsl(var(--accent)/.12)" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round"/></>}
      {k === "settings" && <><circle cx="32" cy="32" r="9" fill="hsl(var(--primary)/.12)" stroke="hsl(var(--primary))" strokeWidth="2.5"/><path d="M32 12v7M32 45v7M12 32h7M45 32h7M18 18l5 5M41 41l5 5M46 18l-5 5M23 41l-5 5" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round"/></>}
    </svg>
  );
};
