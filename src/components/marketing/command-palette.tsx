"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { marketingCommandPages, searchCommandPages } from "@/lib/marketing/command-pages";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-opt-${index}`;
  const pages = useMemo(() => marketingCommandPages(), []);
  const results = useMemo(() => searchCommandPages(query, pages), [query, pages]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onFocusIn(event: FocusEvent) {
      const root = dialogRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        inputRef.current?.focus();
      }
    }
    document.addEventListener("focusin", onFocusIn);

    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
      document.removeEventListener("focusin", onFocusIn);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmdk-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open, results.length]);

  if (!open) return null;

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(false);
      return;
    }
    if (event.key === "Tab") {
      // Keep focus inside the dialog (simple trap: cycle input ↔ list).
      event.preventDefault();
      if (document.activeElement === inputRef.current) {
        const first = listRef.current?.querySelector<HTMLElement>("[data-cmdk-index]");
        first?.focus();
      } else {
        inputRef.current?.focus();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(Math.max(results.length - 1, 0), i + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
      return;
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  }

  return (
    <div className="mkt-cmdk fixed inset-0 z-[120]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--mkt-hero)_62%,transparent)]"
        aria-label="Close search"
        tabIndex={-1}
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        className="relative mx-auto mt-[12vh] w-[min(100%-1.5rem,36rem)] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lg)]"
        onKeyDown={onKeyDown}
      >
        <div className="border-b border-border px-3 py-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages…"
            className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={results[active] ? optionId(active) : undefined}
            role="combobox"
            aria-expanded="true"
            aria-haspopup="listbox"
          />
        </div>
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="max-h-[min(60vh,22rem)] overflow-y-auto p-2"
        >
          {results.length ? (
            results.map((page, index) => (
              <li key={page.href} role="presentation">
                <Link
                  id={optionId(index)}
                  href={page.href}
                  role="option"
                  aria-selected={index === active}
                  data-cmdk-index={index}
                  tabIndex={-1}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    index === active ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted/70",
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onOpenChange(false)}
                >
                  <span className="font-medium">{page.title}</span>
                  <span className="text-[11px] text-muted-foreground">{page.group}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matching pages</li>
          )}
        </ul>
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Existing site pages only · ↑↓ to move · Enter to open · Esc to close
        </p>
      </div>
    </div>
  );
}
