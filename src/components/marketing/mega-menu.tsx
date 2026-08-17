"use client";

import type { KeyboardEventHandler } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
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
  Layers3,
  LayoutGrid,
  Leaf,
  List,
  ListChecks,
  Lock,
  Mail,
  Mountain,
  Puzzle,
  Radar,
  Scale,
  Settings2,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { isNavPathActive, type MegaColumn, type NavLink } from "@/lib/marketing/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
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
  Layers3,
  LayoutGrid,
  Leaf,
  List,
  ListChecks,
  Lock,
  Mail,
  Mountain,
  Puzzle,
  Radar,
  Scale,
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
  panel?: boolean;
  footer?: NavLink;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
};

export function MegaMenu({
  columns,
  open,
  id,
  onNavigate,
  panel = false,
  footer,
  onKeyDown,
}: MegaMenuProps) {
  const pathname = usePathname();
  const wide = columns.length > 2;
  const cols = columns.length;

  return (
    <div
      id={id}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-[80] max-h-[min(70vh,42rem)] overflow-y-auto overflow-x-hidden bg-card text-card-foreground",
        panel
          ? "w-full rounded-none border-0 shadow-none"
          : cn(
              "rounded-2xl border border-border shadow-[var(--shadow-lg)]",
              wide ? "w-[min(48rem,calc(100vw-1.5rem))]" : "w-[min(36rem,calc(100vw-1.5rem))]",
            ),
      )}
    >
      <div className="h-px bg-[linear-gradient(90deg,var(--mkt-safety),transparent_70%)]" />
      <div className={cn("p-3 sm:p-4", panel && "sm:px-0 sm:py-5")}>
        <div
          className={cn(
            "grid gap-4 sm:gap-6",
            cols === 1 && "grid-cols-1",
            cols === 2 && "sm:grid-cols-2",
            cols >= 3 && "lg:grid-cols-3",
          )}
        >
          {columns.map((column) => (
            <div
              key={column.title}
              className={cn(
                column.accent &&
                  "rounded-2xl bg-muted/70 p-3 ring-1 ring-border sm:p-4",
              )}
            >
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="space-y-0.5">
                {column.links.map((link) => {
                  const Icon = link.icon ? ICONS[link.icon] : null;
                  const current = isNavPathActive(pathname, link.href);
                  return (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        data-mkt-nav-item=""
                        aria-current={current ? "page" : undefined}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-11 items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                          column.accent && "hover:bg-card/80",
                          current && "bg-muted",
                        )}
                      >
                        {Icon ? (
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--mkt-safety)] ring-1 ring-border",
                              current
                                ? "bg-[color-mix(in_srgb,var(--mkt-safety)_14%,transparent)]"
                                : "bg-[color-mix(in_srgb,var(--mkt-safety)_8%,var(--card))]",
                            )}
                          >
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
        {footer ? (
          <div className="mt-4 border-t border-border pt-3">
            <Link
              href={footer.href}
              data-mkt-nav-item=""
              onClick={onNavigate}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-[var(--mkt-safety)] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              {footer.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
