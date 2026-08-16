"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  Factory,
  FileBadge,
  FileSearch,
  Flame,
  FolderOpen,
  GraduationCap,
  HardHat,
  Landmark,
  LayoutGrid,
  Leaf,
  ListChecks,
  Lock,
  Mountain,
  Puzzle,
  Radar,
  Settings2,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MegaColumn } from "@/lib/marketing/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  Factory,
  FileBadge,
  FileSearch,
  Flame,
  FolderOpen,
  GraduationCap,
  HardHat,
  Landmark,
  LayoutGrid,
  Leaf,
  ListChecks,
  Lock,
  Mountain,
  Puzzle,
  Radar,
  Settings2,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Zap,
};

type MegaMenuProps = {
  columns: MegaColumn[];
  open: boolean;
  id?: string;
  onNavigate?: () => void;
};

export function MegaMenu({ columns, open, id, onNavigate }: MegaMenuProps) {
  const wide = columns.some((c) => c.links.length > 4) || columns.length > 1;

  return (
    <div
      id={id}
      role="menu"
      hidden={!open}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-lg)]",
        wide ? "w-[min(42rem,calc(100vw-1.5rem))]" : "w-[min(22rem,calc(100vw-1.5rem))]",
      )}
    >
      <div className="h-px bg-[linear-gradient(90deg,var(--mkt-safety),transparent_70%)]" />
      <div className="p-3 sm:p-4">
        <div
          className={cn(
            "grid gap-4 sm:gap-6",
            columns.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
          )}
        >
          {columns.map((column) => (
            <div key={column.title}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="space-y-0.5">
                {column.links.map((link) => {
                  const Icon = link.icon ? ICONS[link.icon] : null;
                  return (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        role="menuitem"
                        onClick={onNavigate}
                        className="flex min-h-11 items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        {Icon ? (
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                        ) : null}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {link.label}
                          </span>
                          {link.description ? (
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                              {link.description}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
