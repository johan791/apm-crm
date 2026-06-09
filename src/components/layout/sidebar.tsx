"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Menu,
  Clock,
  FileText,
  CalendarDays,
  Handshake,
  LogOut,
  Activity,
  Receipt,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SessionUser {
  name?: string | null;
  email?: string | null;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/aktiviteter", label: "Aktiviteter", icon: Activity },
    ],
  },
  {
    label: "Hantera",
    items: [
      { href: "/kunder", label: "Kunder", icon: Users },
      { href: "/projekt", label: "Projekt", icon: FolderKanban },
      { href: "/mejl", label: "Maillogg", icon: Mail },
      { href: "/partners", label: "Partners", icon: Handshake },
    ],
  },
  {
    label: "Ekonomi",
    items: [
      { href: "/offerter", label: "Offerter", icon: FileText },
      { href: "/tidrapportering", label: "Tidrapportering", icon: Clock },
      { href: "/fakturaunderlag", label: "Fakturaunderlag", icon: Receipt },
    ],
  },
  {
    label: "Planera",
    items: [
      {
        href: "/leveransplanering",
        label: "Leveransplanering",
        icon: CalendarDays,
      },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navSections.map((section, sIdx) => (
        <div key={sIdx}>
          {section.label && (
            <p className="px-3 mb-1 mt-5 text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-14 items-center mb-2 px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          A
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">APM Project</p>
          <p className="text-xs text-muted-foreground">Projekthub</p>
        </div>
      </Link>
    </div>
  );
}

function SidebarFooter({ user }: { user: SessionUser }) {
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mt-2 p-3 pt-3">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground mt-0.5">
            {user.email}
          </p>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit" title="Logga ut">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function DesktopSidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:bg-card h-screen sticky top-0">
      <SidebarHeader />
      <div className="flex-1 py-4 overflow-y-auto">
        <NavLinks />
      </div>
      <SidebarFooter user={user} />
    </aside>
  );
}

export function MobileNav({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex h-14 items-center shadow-sm px-4 bg-card">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="mr-2" />
          }
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Meny</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SidebarHeader />
          <div className="flex-1 py-4 overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter user={user} />
        </SheetContent>
      </Sheet>
      <p className="text-sm font-semibold">APM Project</p>
    </div>
  );
}
