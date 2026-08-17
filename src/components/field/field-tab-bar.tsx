"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Home,
  PlusCircle,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/field", label: "Home", icon: Home, match: (p: string) => p === "/field" || p === "/field/home" },
  {
    href: "/field/report",
    label: "Report",
    icon: PlusCircle,
    match: (p: string) =>
      p.startsWith("/field/report") ||
      p.startsWith("/field/new") ||
      p.startsWith("/field/incident") ||
      p.startsWith("/field/near-miss") ||
      p.startsWith("/field/lmra") ||
      p.startsWith("/field/hazard"),
  },
  { href: "/field/actions", label: "Actions", icon: ClipboardList, match: (p: string) => p.startsWith("/field/actions") },
  { href: "/field/permits", label: "Permits", icon: Shield, match: (p: string) => p.startsWith("/field/permits") },
  {
    href: "/field/inspection",
    label: "Inspect",
    icon: ClipboardCheck,
    match: (p: string) => p.startsWith("/field/inspection"),
  },
  {
    href: "/field/training",
    label: "Train",
    icon: GraduationCap,
    match: (p: string) => p.startsWith("/field/training"),
  },
  { href: "/field/profile", label: "Me", icon: User, match: (p: string) => p.startsWith("/field/profile") },
];

export function FieldTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-7 gap-0.5 px-1 py-1">
        {tabs.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-lg px-0.5 text-[10px] font-semibold transition-colors",
                active
                  ? "bg-primary text-white dark:text-[#071f2d]"
                  : "text-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="mb-0.5 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
