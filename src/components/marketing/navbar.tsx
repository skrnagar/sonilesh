"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
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
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const openedBy = useRef<"hover" | "click" | null>(null);
  const inverse = pathname === "/" && !scrolled && !mobileOpen && !openMenu;

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openFromHover(label: string) {
    clearCloseTimer();
    openedBy.current = "hover";
    setOpenMenu(label);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => {
      setOpenMenu(null);
      openedBy.current = null;
    }, 160);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenMenu(null);
      setMobileOpen(false);
      openedBy.current = null;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
        openedBy.current = null;
      }
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navLink = cn(
    "inline-flex min-h-11 items-center gap-1 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none xl:px-3",
    inverse
      ? "text-white/80 hover:bg-white/10 hover:text-white"
      : "text-foreground/80 hover:bg-muted hover:text-foreground",
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color,color] duration-200 motion-reduce:transition-none",
        inverse
          ? "border-transparent bg-transparent"
          : scrolled
            ? "border-border/80 bg-card/95 shadow-[var(--shadow-header)] backdrop-blur-xl"
            : "border-border/60 bg-card/90 backdrop-blur-xl",
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-2 md:h-16 md:gap-3 lg:h-[4.25rem]">
        <Link
          href="/"
          className="group min-w-0 shrink"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLockup
            inverse={inverse}
            size="sm"
            className="transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none md:[&_svg]:h-9 md:[&_svg]:w-9"
          />
        </Link>

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {primaryNav.map((item, index) => {
            const hasMega = Boolean(item.columns?.length);
            const isOpen = openMenu === item.label;
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => {
                  if (!hasMega) return;
                  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    openFromHover(item.label);
                  }
                }}
                onMouseLeave={() => {
                  if (!hasMega) return;
                  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    scheduleClose();
                  }
                }}
              >
                {hasMega ? (
                  <>
                    <button
                      type="button"
                      className={cn(
                        navLink,
                        isOpen && (inverse ? "bg-white/10 text-white" : "bg-muted text-foreground"),
                      )}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                      aria-controls={`${menuId}-${item.label}`}
                      onClick={() => {
                        if (isOpen && openedBy.current === "hover") {
                          openedBy.current = "click";
                          return;
                        }
                        openedBy.current = "click";
                        setOpenMenu(isOpen ? null : item.label);
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 opacity-70 transition-transform duration-200 motion-reduce:transition-none",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "absolute top-full z-[60] pt-2",
                        index > 2 ? "right-0" : "left-0",
                        isOpen ? "pointer-events-auto" : "pointer-events-none",
                      )}
                      onMouseEnter={clearCloseTimer}
                    >
                      {isOpen ? (
                        <MegaMenu
                          id={`${menuId}-${item.label}`}
                          columns={item.columns!}
                          open
                          onNavigate={() => {
                            setOpenMenu(null);
                            openedBy.current = null;
                          }}
                        />
                      ) : null}
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle
            compact
            className={cn(
              "min-h-11 min-w-11",
              inverse && "border-white/20 bg-white/10 text-white shadow-none hover:bg-white/15",
            )}
          />
          <Button
            asChild
            variant="ghost"
            className={cn(
              "hidden min-h-11 lg:inline-flex",
              inverse ? "text-white/85 hover:bg-white/10 hover:text-white" : "text-foreground/90",
            )}
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="safety" className="h-11 min-h-11 px-3 text-sm sm:px-4">
            <Link href="/request-demo">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Request demo</span>
            </Link>
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-lg border lg:hidden",
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
          <Container className="max-h-[min(calc(100dvh-3.5rem),720px)] space-y-1 overflow-y-auto py-3 pb-6">
            {primaryNav.map((item) => {
              const hasMega = Boolean(item.columns?.length);
              const expanded = mobileSection === item.label;
              if (!hasMega) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div key={item.label} className="rounded-xl">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-foreground hover:bg-muted"
                    aria-expanded={expanded}
                    onClick={() => setMobileSection(expanded ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground", expanded && "rotate-180")} />
                  </button>
                  {expanded ? (
                    <div className="space-y-3 px-2 pb-3 pt-1">
                      {item.columns!.map((col) => (
                        <div key={col.title}>
                          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {col.title}
                          </p>
                          {col.links.map((link) => (
                            <Link
                              key={link.href + link.label}
                              href={link.href}
                              className="block min-h-11 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => setMobileOpen(false)}
                            >
                              <span className="font-medium text-foreground">{link.label}</span>
                              {link.description ? (
                                <span className="mt-0.5 block text-xs leading-snug">{link.description}</span>
                              ) : null}
                            </Link>
                          ))}
                        </div>
                      ))}
                      <Link
                        href={item.href}
                        className="block min-h-11 px-2 text-sm font-medium text-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        View all {item.label.toLowerCase()}
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <Button asChild variant="outline" className="h-12 min-h-12">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="safety" className="h-12 min-h-12">
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
