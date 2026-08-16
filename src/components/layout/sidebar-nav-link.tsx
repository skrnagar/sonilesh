"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

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
      <span className="sidebar-glyph h-8 w-8 items-center justify-center rounded-lg bg-[var(--sidebar-active)] text-xs font-semibold text-primary">
        {label.slice(0, 1)}
      </span>
      <span className="sidebar-copy truncate">{label}</span>
    </Link>
  );
}
