"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/marketing/container";
import { MegaMenu } from "@/components/marketing/mega-menu";
import { openMarketingCommandPalette } from "@/lib/marketing/command-events";
import { isNavPathActive, primaryNav, type PrimaryNavItem } from "@/lib/marketing/nav";
import { cn } from "@/lib/utils";

function focusNavItems(root: HTMLElement | null, delta: number) {
  const items = Array.from(root?.querySelectorAll<HTMLElement>("[data-mkt-nav-item]") ?? []);
  if (!items.length) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  const next = index < 0 ? 0 : (index + delta + items.length) % items.length;
  items[next]?.focus();
}

export function Navbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+K");
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const wasMobileOpen = useRef(false);
  const triggerRefs = useRef<Record<string, HTMLElement | null>>({});
  const closeTimer = useRef<number | null>(null);
  const openedBy = useRef<"hover" | "click" | "keyboard" | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function closeMenus() {
    clearCloseTimer();
    setOpenMenu(null);
    openedBy.current = null;
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
    const apple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    setShortcutLabel(apple ? "⌘K" : "Ctrl+K");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
    setOpenMenu(null);
    openedBy.current = null;
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileOpen) {
        setMobileOpen(false);
        return;
      }
      const trigger = openMenu ? triggerRefs.current[openMenu] : null;
      closeMenus();
      trigger?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, openMenu]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        closeMenus();
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

  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpen.current = true;
      lastFocusRef.current = document.activeElement as HTMLElement;
      closeBtnRef.current?.focus();
      return;
    }
    if (wasMobileOpen.current) {
      lastFocusRef.current?.focus();
      wasMobileOpen.current = false;
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!openMenu || openedBy.current !== "keyboard") return;
    const panel = document.getElementById(`${menuId}-${openMenu}`);
    panel?.querySelector<HTMLElement>("[data-mkt-nav-item]")?.focus();
  }, [openMenu, menuId]);

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLElement>, item: PrimaryNavItem, index: number) {
    if (e.key === "ArrowDown" && item.columns) {
      e.preventDefault();
      openedBy.current = "keyboard";
      setOpenMenu(item.label);
      return;
    }
    if (e.key === "ArrowUp" && item.columns) {
      e.preventDefault();
      openedBy.current = "keyboard";
      setOpenMenu(item.label);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const next = primaryNav[(index + delta + primaryNav.length) % primaryNav.length];
      triggerRefs.current[next.label]?.focus();
      if (next.columns) {
        openedBy.current = "keyboard";
        setOpenMenu(next.label);
      } else {
        closeMenus();
      }
    }
  }

  function onPanelKeyDown(e: ReactKeyboardEvent<HTMLDivElement>, item: PrimaryNavItem, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusNavItems(e.currentTarget, 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusNavItems(e.currentTarget, -1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      e.currentTarget.querySelector<HTMLElement>("[data-mkt-nav-item]")?.focus();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      const items = e.currentTarget.querySelectorAll<HTMLElement>("[data-mkt-nav-item]");
      items[items.length - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const next = primaryNav[(index + delta + primaryNav.length) % primaryNav.length];
      triggerRefs.current[next.label]?.focus();
      if (next.columns) {
        openedBy.current = "keyboard";
        setOpenMenu(next.label);
      } else {
        closeMenus();
      }
    }
  }

  function onDrawerKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const navLink =
    "relative inline-flex min-h-11 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold tracking-[-0.01em] text-foreground/70 transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none xl:gap-1 xl:px-3";

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 isolate overflow-visible border-b transition-[background-color,box-shadow,border-color] duration-200 motion-reduce:transition-none",
        scrolled
          ? "border-border/80 bg-card/85 shadow-[var(--shadow-md)] backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-card/70 shadow-[var(--shadow-header)] backdrop-blur-md backdrop-saturate-150",
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-2 md:h-16 md:gap-3 lg:h-[4.25rem]">
        <Link
          href="/"
          className="group min-w-0 shrink"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLockup
            size="sm"
            className="transition-opacity duration-200 group-hover:opacity-90 motion-reduce:transition-none md:[&_svg]:h-9 md:[&_svg]:w-9"
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 overflow-visible lg:flex xl:justify-center" aria-label="Primary">
          {primaryNav.map((item, index) => {
            const hasMega = Boolean(item.columns?.length);
            const isOpen = openMenu === item.label;
            const current = isNavPathActive(pathname, item.href);
            const fullBleed = (item.columns?.length ?? 0) >= 3;
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
                      ref={(node) => {
                        triggerRefs.current[item.label] = node;
                      }}
                      className={cn(navLink, (isOpen || current) && "bg-muted text-foreground")}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      aria-controls={`${menuId}-${item.label}`}
                      onKeyDown={(e) => onTriggerKeyDown(e, item, index)}
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
                          "h-3.5 w-3.5 text-foreground/70 transition-transform duration-200 motion-reduce:transition-none",
                          isOpen && "rotate-180",
                        )}
                      />
                      {current ? (
                        <span
                          aria-hidden
                          className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-[var(--mkt-safety)]"
                        />
                      ) : null}
                    </button>
                    {fullBleed ? (
                      <div
                        className={cn(
                          "fixed inset-x-0 z-[80] bg-card",
                          "top-14 md:top-16 lg:top-[4.25rem]",
                          "mkt-mega-panel",
                          isOpen && "border-b border-border shadow-[var(--shadow-lg)]",
                        )}
                        data-open={isOpen ? "true" : "false"}
                        onMouseEnter={clearCloseTimer}
                      >
                        <div className="mkt-mega-panel-inner">
                          <Container>
                            <MegaMenu
                              id={`${menuId}-${item.label}`}
                              columns={item.columns!}
                              open={isOpen}
                              panel
                              footer={item.footer}
                              onKeyDown={(e) => onPanelKeyDown(e, item, index)}
                              onNavigate={closeMenus}
                            />
                          </Container>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="mkt-nav-dropdown absolute left-1/2 top-full z-[80] -translate-x-1/2 pt-2"
                        data-open={isOpen ? "true" : "false"}
                        onMouseEnter={clearCloseTimer}
                      >
                        <MegaMenu
                          id={`${menuId}-${item.label}`}
                          columns={item.columns!}
                          open={isOpen}
                          footer={item.footer}
                          onKeyDown={(e) => onPanelKeyDown(e, item, index)}
                          onNavigate={closeMenus}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    ref={(node) => {
                      triggerRefs.current[item.label] = node;
                    }}
                    aria-current={current ? "page" : undefined}
                    className={cn(navLink, current && "bg-muted text-foreground")}
                    onKeyDown={(e) => onTriggerKeyDown(e, item, index)}
                  >
                    {item.label}
                    {current ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-[var(--mkt-safety)]"
                      />
                    ) : null}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="hidden min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex"
            onClick={() => openMarketingCommandPalette()}
            aria-label="Search site"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span>Search</span>
            <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground xl:inline">
              {shortcutLabel}
            </kbd>
          </button>
          <Button asChild variant="ghost" className="hidden min-h-11 text-foreground lg:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="hidden h-11 min-h-11 px-3 text-sm lg:inline-flex">
            <Link href="/signup">Start Free</Link>
          </Button>
          <Button asChild variant="safety" className="h-11 min-h-11 px-3 text-sm sm:px-4">
            <Link href="/book-a-demo">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Book a Demo</span>
            </Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls={`${menuId}-drawer`}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <div
        ref={drawerRef}
        id={`${menuId}-drawer`}
        className="mkt-nav-drawer fixed inset-0 z-[70] lg:hidden"
        data-open={mobileOpen ? "true" : "false"}
        inert={!mobileOpen ? true : undefined}
      >
        <button
          type="button"
          className="mkt-nav-drawer-backdrop absolute inset-0 bg-[color-mix(in_srgb,var(--mkt-hero)_55%,transparent)]"
          aria-label="Close menu"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="mkt-nav-drawer-panel absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-[var(--shadow-lg)]"
          onKeyDown={onDrawerKeyDown}
        >
          <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 md:h-16">
            <BrandLockup size="sm" />
            <button
              ref={closeBtnRef}
              type="button"
              className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
            {primaryNav.map((item) => {
              const hasMega = Boolean(item.columns?.length);
              const expanded = mobileSection === item.label;
              const current = isNavPathActive(pathname, item.href);
              if (!hasMega) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-muted",
                      current && "bg-muted",
                    )}
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
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-foreground hover:bg-muted",
                      (expanded || current) && "bg-muted",
                    )}
                    aria-expanded={expanded}
                    onClick={() => setMobileSection(expanded ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")} />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                      expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3 px-1 pb-3 pt-1">
                        {item.columns!.map((col) => (
                          <div key={col.title} className={cn(col.accent && "rounded-xl bg-muted/80 p-2 ring-1 ring-border")}>
                            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              {col.title}
                            </p>
                            {col.links.map((link) => (
                              <Link
                                key={link.href + link.label}
                                href={link.href}
                                aria-current={isNavPathActive(pathname, link.href) ? "page" : undefined}
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
                          className="block min-h-11 px-2 text-sm font-medium text-[var(--mkt-safety)]"
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.footer?.label ?? `View all ${item.label.toLowerCase()}`}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button asChild variant="safety" className="h-12 min-h-12">
              <Link href="/book-a-demo" onClick={() => setMobileOpen(false)}>
                Book a Demo
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 min-h-12">
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                Start Free
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 min-h-11">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
