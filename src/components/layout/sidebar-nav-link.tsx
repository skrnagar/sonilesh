"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
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
  ListChecks,
  ListTree,
  MessagesSquare,
  Settings,
  Shield,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
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
  ListChecks,
  ListTree,
  MessagesSquare,
  Settings,
  Shield,
  ShieldAlert,
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
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icon ? ICONS[icon] : null;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--sidebar-active)] font-medium text-primary"
          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]",
      )}
      title={label}
    >
      <span
        className={cn(
          "sidebar-glyph !flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-white/80 text-primary dark:bg-white/10" : "bg-[var(--sidebar-active)] text-primary",
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : label.slice(0, 1)}
      </span>
      <span className="sidebar-copy truncate">{label}</span>
    </Link>
  );
}
