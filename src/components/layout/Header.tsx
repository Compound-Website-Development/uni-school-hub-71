import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Search } from "lucide-react";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  notifications?: number;
}

export const Header = ({
  title,
  showSearch = true,
  searchPlaceholder = "Search...",
  actions,
  notifications = 0,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 transition-colors z-10">
      {/* Mobile Menu */}
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        {title && <span className="font-bold text-lg text-foreground">{title}</span>}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-lg">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10 bg-secondary border-transparent focus:border-primary focus:bg-background"
            />
          </div>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full ring-2 ring-card"></span>
          )}
        </Button>

        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
};
