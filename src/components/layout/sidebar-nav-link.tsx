"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
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
  Inbox,
  Landmark,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  ListChecks,
  ListTree,
  MessagesSquare,
  Puzzle,
  Recycle,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarDays,
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
  Inbox,
  Landmark,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  ListChecks,
  ListTree,
  MapPin,
  MessagesSquare,
  Puzzle,
  Recycle,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
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
      prefetch={false}
      title={label}
      className={cn(
        "sidebar-nav-link flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary font-medium text-white shadow-[var(--shadow-sm)] dark:text-[#071f2d]"
          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "sidebar-glyph !flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          active ? "bg-white/15 text-white dark:bg-card dark:text-[#071f2d]" : "bg-sidebar-active/80 text-primary",
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : label.slice(0, 1)}
      </span>
      <span className="sidebar-copy min-w-0 truncate">{label}</span>
    </Link>
  );
}
