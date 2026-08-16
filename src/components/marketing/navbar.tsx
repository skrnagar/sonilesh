"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/marketing/container";
import { MegaMenu } from "@/components/marketing/mega-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { primaryNav } from "@/lib/marketing/nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-200 motion-reduce:transition-none",
        scrolled
          ? "border-border/80 bg-card/95 shadow-[var(--shadow-header)] backdrop-blur-md"
          : "border-transparent bg-card/90 backdrop-blur-md",
      )}
    >
      <Container className="flex h-[4.35rem] items-center justify-between gap-3">
        <Link
          href="/"
          className="group min-w-0 shrink"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLockup className="transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {primaryNav.map((item) => {
            const hasMega = Boolean(item.columns?.length);
            const isOpen = openMenu === item.label;
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasMega && setOpenMenu(item.label)}
                onMouseLeave={() => hasMega && setOpenMenu(null)}
              >
                {hasMega ? (
                  <>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium tracking-[-0.01em] text-foreground/90 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isOpen && "bg-muted text-foreground",
                      )}
                      aria-expanded={isOpen}
                      aria-controls={`${menuId}-${item.label}`}
                      onClick={() => setOpenMenu(isOpen ? null : item.label)}
                      onFocus={() => setOpenMenu(item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <div id={`${menuId}-${item.label}`}>
                      <MegaMenu
                        columns={item.columns!}
                        open={isOpen}
                        onNavigate={() => setOpenMenu(null)}
                      />
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-[13px] font-medium tracking-[-0.01em] text-foreground/90 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle compact className="hidden sm:inline-flex" />
          <Button asChild variant="ghost" className="hidden text-foreground/90 lg:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="h-10 bg-[var(--mkt-safety)] px-3.5 text-white hover:bg-[#0d6b63] sm:px-4"
          >
            <Link href="/request-demo">Request demo</Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-t border-border bg-card lg:hidden">
          <Container className="max-h-[min(80vh,640px)] space-y-4 overflow-y-auto py-5">
            {primaryNav.map((item) => (
              <div key={item.label} className="space-y-2">
                <Link
                  href={item.href}
                  className="block text-sm font-semibold text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.columns?.flatMap((col) =>
                  col.links.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="block rounded-md py-1.5 pl-3 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )),
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <ThemeToggle compact />
              <Button asChild variant="outline" className="h-11 flex-1">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 flex-1 bg-[var(--mkt-safety)] text-white hover:bg-[#0d6b63]"
              >
                <Link href="/request-demo" onClick={() => setMobileOpen(false)}>
                  Request demo
                </Link>
              </Button>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
