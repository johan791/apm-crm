"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kunder", label: "Kunder", icon: Users },
  { href: "/projekt", label: "Projekt", icon: FolderKanban },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
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
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-14 items-center border-b px-4">
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

export function DesktopSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card h-screen sticky top-0">
      <SidebarHeader />
      <div className="flex-1 py-4">
        <NavLinks />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex h-14 items-center border-b px-4 bg-card">
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
          <div className="py-4">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <p className="text-sm font-semibold">APM Project</p>
    </div>
  );
}
