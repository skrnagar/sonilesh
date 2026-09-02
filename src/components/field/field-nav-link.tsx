"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { FieldNavItem } from "@/lib/field/nav";
import { cn } from "@/lib/utils";

type FieldNavLinkProps = {
  item: FieldNavItem;
  pathname: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
};

/** Field tab/desktop link with instant active state and hover prefetch. */
export function FieldNavLink({
  item,
  pathname,
  activeClassName,
  inactiveClassName,
  children,
}: FieldNavLinkProps) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const active = pendingHref ? pendingHref === item.href : item.match(pathname);

  function prefetchRoute() {
    if (!item.prefetch) {
      router.prefetch(item.href);
    }
  }

  return (
    <Link
      href={item.href}
      prefetch={item.prefetch}
      aria-current={active ? "page" : undefined}
      onClick={() => setPendingHref(item.href)}
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      className={cn(active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
