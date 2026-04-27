import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ProfileHeroProps {
  name: string;
  subtitle?: string;
  badges?: { label: string; variant?: "default" | "secondary" | "outline" }[];
  initials: string;
  cover?: string; // gradient class
}

export const ProfileHero = ({ name, subtitle, badges = [], initials, cover = "from-primary via-primary/80 to-accent" }: ProfileHeroProps) => (
  <div className="relative animate-fade-in">
    <div className={`h-40 rounded-2xl bg-gradient-to-br ${cover} shadow-lg`} />
    <Card className="rounded-2xl border-border/50 -mt-12 mx-4 shadow-xl">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 sm:pb-2">
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {badges.map((b, i) => (
                <Badge key={i} variant={b.variant || "default"} className="capitalize">{b.label}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

interface InfoSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const InfoSection = ({ title, icon: Icon, children }: InfoSectionProps) => (
  <Card className="rounded-2xl border-border/50 shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">{children}</CardContent>
  </Card>
);

export const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="flex justify-between items-start gap-3 text-sm py-1 border-b border-border/30 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground text-right">{value || "—"}</span>
  </div>
);
