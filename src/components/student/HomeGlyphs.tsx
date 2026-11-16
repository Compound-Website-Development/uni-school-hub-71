import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const HomeGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3.5 10.5 12 3l8.5 7.5" />
    <path d="M5.5 9.2V21h13V9.2M9.5 21v-6h5v6" />
  </svg>
);

export const GradesGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="M5 20V11M12 20V4M19 20v-6" />
    <path d="M3 20.5h18" />
    <circle cx="5" cy="8" r="1.5" />
    <circle cx="12" cy="2.5" r="1.5" />
    <circle cx="19" cy="11.5" r="1.5" />
  </svg>
);

export const ReportsGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="M6 2.5h8l4 4V21H6z" />
    <path d="M14 2.5V7h4M9 11h6M9 15h6M9 19h3" />
  </svg>
);

export const ScheduleGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18M7 14h2M12 14h2M17 14h.1M7 18h2M12 18h2" />
  </svg>
);

export const ProfileGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21c.7-4.1 3.2-6.2 7.5-6.2s6.8 2.1 7.5 6.2" />
  </svg>
);

export const BookGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="M4 5.5c2.8-.8 5.5 0 8 2.2v12c-2.5-2.2-5.2-3-8-2.2z" />
    <path d="M20 5.5c-2.8-.8-5.5 0-8 2.2v12c2.5-2.2 5.2-3 8-2.2z" />
  </svg>
);

export const TrendGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="m4 17 5-5 3.5 3.5L20 8" />
    <path d="M15 8h5v5" />
  </svg>
);

export const ShieldGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <path d="M12 3 20 6v5c0 5-3 8.3-8 10-5-1.7-8-5-8-10V6z" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </svg>
);

export const HomeworkGlyph = (props: GlyphProps) => (
  <svg {...baseProps} {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3.5h6v3H9zM9 11h6M9 15h4" />
  </svg>
);