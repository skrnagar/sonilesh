"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Eye,
  FileBadge,
  FileSearch,
  FileText,
  FlaskConical,
  Folder,
  GitBranch,
  GraduationCap,
  Grid2x2,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  ListTree,
  MessagesSquare,
  Puzzle,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Eye,
  FileBadge,
  FileSearch,
  FileText,
  FlaskConical,
  Folder,
  GitBranch,
  GraduationCap,
  Grid2x2,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  ListTree,
  MessagesSquare,
  Puzzle,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Users,
};

export function SidebarNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: string;
}) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icon ? ICONS[icon] : null;

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "sidebar-nav-link flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary font-medium text-white dark:text-[#071f2d]"
          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "sidebar-glyph !flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-white/15 text-white dark:bg-card dark:text-[#071f2d]" : "bg-sidebar-active text-primary",
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : label.slice(0, 1)}
      </span>
      <span className="sidebar-copy min-w-0 truncate">{label}</span>
    </Link>
  );
}
