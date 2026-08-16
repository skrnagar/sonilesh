"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const inverse = pathname === "/" && !scrolled && !mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navLink = cn(
    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
    inverse
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-foreground/80 hover:bg-muted hover:text-foreground",
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color,color] duration-200 motion-reduce:transition-none",
        inverse
          ? "border-transparent bg-transparent"
          : scrolled
            ? "border-border/80 bg-card/90 shadow-[var(--shadow-header)] backdrop-blur-xl"
            : "border-border/60 bg-card/85 backdrop-blur-xl",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3 md:h-[4.25rem]">
        <Link
          href="/"
          className="group min-w-0 shrink"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLockup
            inverse={inverse}
            className="transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none"
          />
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
                      className={cn(navLink, isOpen && (inverse ? "bg-white/10 text-white" : "bg-muted text-foreground"))}
                      aria-expanded={isOpen}
                      aria-controls={`${menuId}-${item.label}`}
                      onClick={() => setOpenMenu(isOpen ? null : item.label)}
                      onFocus={() => setOpenMenu(item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 opacity-70 transition-transform duration-200 motion-reduce:transition-none",
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
                  <Link href={item.href} className={navLink}>
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle
            compact
            className={cn(
              "hidden sm:inline-flex",
              inverse && "border-white/20 bg-white/10 text-white shadow-none hover:bg-white/15",
            )}
          />
          <Button
            asChild
            variant="ghost"
            className={cn(
              "hidden lg:inline-flex",
              inverse ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-foreground/90",
            )}
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="safety" className="h-10 px-3.5 sm:px-4">
            <Link href="/request-demo">Request demo</Link>
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg border lg:hidden",
              inverse
                ? "border-white/20 bg-white/10 text-white"
                : "border-border bg-card",
            )}
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
          <Container className="max-h-[min(78vh,640px)] space-y-5 overflow-y-auto py-5">
            {primaryNav.map((item) => (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.href}
                  className="block py-1 text-sm font-semibold text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.columns?.flatMap((col) =>
                  col.links.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="block rounded-lg py-2.5 pl-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )),
                )}
              </div>
            ))}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
              <ThemeToggle compact />
              <Button asChild variant="outline" className="h-12 flex-1">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="safety" className="h-12 flex-1">
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
