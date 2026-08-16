"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, PlusCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/field", label: "Home", icon: Home, match: (p: string) => p === "/field" },
  {
    href: "/field/new",
    label: "New",
    icon: PlusCircle,
    match: (p: string) =>
      p.startsWith("/field/new") ||
      p.startsWith("/field/incident") ||
      p.startsWith("/field/near-miss") ||
      p.startsWith("/field/lmra") ||
      p.startsWith("/field/hazard") ||
      p.startsWith("/field/report"),
  },
  { href: "/field/actions", label: "Actions", icon: ClipboardList, match: (p: string) => p.startsWith("/field/actions") },
  { href: "/field/permits", label: "Permits", icon: Shield, match: (p: string) => p.startsWith("/field/permits") },
];

export function FieldTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-1.5">
        {tabs.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-xl px-1 text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-white dark:text-[#071f2d]"
                  : "text-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="mb-1 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
