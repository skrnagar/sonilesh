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
        "block rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-white/14 font-medium text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}
