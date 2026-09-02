"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Thin top progress bar — visible during client navigations. */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || anchor.target === "_blank") {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next !== current) setActive(true);
    }

    function onSubmit() {
      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-150",
        active ? "opacity-100" : "opacity-0",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "h-full w-1/3 bg-[var(--raksha-blue)] shadow-[0_0_8px_var(--raksha-blue)]",
          active && "animate-[nav-progress_0.9s_ease-in-out_infinite]",
        )}
      />
    </div>
  );
}
