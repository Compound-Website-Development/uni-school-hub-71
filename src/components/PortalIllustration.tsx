import type { CSSProperties } from "react";

type IllustrationKind =
  | "home"
  | "book"
  | "finance"
  | "results"
  | "report"
  | "transcript"
  | "cbt"
  | "homework"
  | "learning"
  | "resources"
  | "library"
  | "schedule"
  | "attendance"
  | "calendar"
  | "announcements"
  | "community"
  | "complaints"
  | "fees"
  | "profile"
  | "settings"
  | "students"
  | "staff"
  | "messages"
  | "forum"
  | "bus"
  | "ai"
  | "calculator"
  | "classes";

const palette: Record<IllustrationKind, [string, string, string]> = {
  home: ["#F3A23A", "#FDE8C7", "#4B5563"],
  book: ["#6F7FA8", "#E7EBF5", "#334155"],
  finance: ["#66856F", "#E5EFE8", "#334155"],
  results: ["#6B8F71", "#E4F0E5", "#334155"],
  report: ["#D9776A", "#FBE5E1", "#475569"],
  transcript: ["#7C6BA6", "#EEE9F8", "#475569"],
  cbt: ["#4E8DA8", "#E2F1F6", "#334155"],
  homework: ["#D28B52", "#F7E7D6", "#475569"],
  learning: ["#5B8C85", "#E2F0EE", "#334155"],
  resources: ["#8A7A55", "#F0EBDD", "#475569"],
  library: ["#6F7FA8", "#E7EBF5", "#334155"],
  schedule: ["#B66D73", "#F5E4E6", "#475569"],
  attendance: ["#4C8A68", "#E2F1E7", "#334155"],
  calendar: ["#B87945", "#F5E8D8", "#475569"],
  announcements: ["#7B779A", "#EBEAF4", "#475569"],
  community: ["#C17A65", "#F6E5DF", "#475569"],
  complaints: ["#A16B7A", "#F3E3E9", "#475569"],
  fees: ["#66856F", "#E5EFE8", "#334155"],
  profile: ["#7B8794", "#E9EDF1", "#334155"],
  settings: ["#6D7C8B", "#E7EBEF", "#334155"],
  students: ["#6D8FB2", "#E3ECF5", "#334155"],
  staff: ["#8B7966", "#EEE8E2", "#334155"],
  messages: ["#B56D63", "#F5E4E0", "#334155"],
  forum: ["#9279A8", "#EEE8F4", "#334155"],
  bus: ["#C58A45", "#F7EAD7", "#334155"],
  ai: ["#806CA5", "#EDE7F7", "#334155"],
  calculator: ["#4D7F88", "#E2EEF0", "#334155"],
  classes: ["#6E8D73", "#E5EEE6", "#334155"],
};

const emoji: Record<IllustrationKind, string> = {
  home: "⌂", book: "▥", finance: "₦", results: "↗", report: "▤", transcript: "≋", cbt: "▣",
  homework: "✓", learning: "✦", resources: "◈", library: "▥", schedule: "◷",
  attendance: "✓", calendar: "□", announcements: "!", community: "◎",
  complaints: "?", fees: "₦", profile: "●", settings: "⚙", students: "●",
  staff: "✦", messages: "↗", forum: "◌", bus: "▰", ai: "✦",
  calculator: "＋", classes: "▦",
};

export const PortalIllustration = ({
  kind = "home",
  className = "",
  size = "md",
}: {
  kind?: IllustrationKind;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const [accent, wash, ink] = palette[kind];
  const style = {
    "--illus-accent": accent,
    "--illus-wash": wash,
    "--illus-ink": ink,
  } as CSSProperties;

  return (
    <span aria-hidden="true" className={`portal-illustration portal-illustration-${size} ${className}`} style={style}>
      <span className="portal-illustration-shadow" />
      <span className="portal-illustration-paper">
        <span className="portal-illustration-mark">{emoji[kind]}</span>
        <span className="portal-illustration-line line-a" />
        <span className="portal-illustration-line line-b" />
        <span className="portal-illustration-dot dot-a" />
        <span className="portal-illustration-dot dot-b" />
      </span>
      <span className="portal-illustration-sun" />
    </span>
  );
};
