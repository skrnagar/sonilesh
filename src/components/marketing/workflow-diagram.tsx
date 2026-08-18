"use client";

import { useEffect, useRef, useState } from "react";
import { lifecycleSteps } from "@/lib/marketing/content";
import { SAMPLE_DATA_LABEL } from "@/lib/marketing/sample-board";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/marketing/use-prefers-reduced-motion";

function stepState(index: number, active: number) {
  if (index < active) return "done" as const;
  if (index === active) return "active" as const;
  return "pending" as const;
}

function LifecycleSnippet({ index }: { index: number }) {
  const title = lifecycleSteps[index]?.title ?? "";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{title} · workspace snippet</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {SAMPLE_DATA_LABEL}
        </p>
      </div>
      {index === 0 ? (
        <div className="mt-3 space-y-2 text-sm">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Event</p>
            <p className="font-medium">Near miss — reversing dump truck</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Near miss", "Medium", "Yard B"].map((chip) => (
              <span key={chip} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {index === 1 ? (
        <ol className="mt-3 space-y-2 text-sm">
          {["Photos from the yard camera", "Spotter not in position", "Owner: Package HSE"].map((row) => (
            <li key={row} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mkt-safety)]" />
              {row}
            </li>
          ))}
        </ol>
      ) : null}
      {index === 2 ? (
        <div className="mt-3 rounded-md border border-border px-3 py-2 text-sm">
          <p className="font-medium">Install convex mirror at gate 2</p>
          <p className="mt-1 text-muted-foreground">Owner: Site engineer · Due: 14 days</p>
        </div>
      ) : null}
      {index === 3 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {["Mirror in place", "Toolbox talk completed", "Effectiveness check scheduled"].map((row) => (
            <li key={row} className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-[var(--mkt-safety)] text-[10px] text-[var(--mkt-safety)]">
                ✓
              </span>
              {row}
            </li>
          ))}
        </ul>
      ) : null}
      {index === 4 ? (
        <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm">
          <p className="font-semibold text-[var(--mkt-safety)]">Record closed</p>
          <p className="mt-1 text-muted-foreground">Auditable trail retained on the same tenant.</p>
        </div>
      ) : null}
    </div>
  );
}

export function WorkflowDiagram({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(0);
  const ignoreScroll = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reduced) {
      setArmed(true);
      return;
    }
    const arm = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArmed(true);
        arm.disconnect();
      },
      { rootMargin: "280px 0px", threshold: 0 },
    );
    arm.observe(root);
    return () => arm.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!armed || reduced) return;
    const desktopMq = window.matchMedia("(min-width: 768px)");
    let stop = () => {};

    function bind() {
      stop();
      const el = rootRef.current;
      if (!el) return;

      if (desktopMq.matches) {
        const onScroll = () => {
          if (Date.now() < ignoreScroll.current) return;
          const node = rootRef.current;
          if (!node) return;
          const rect = node.getBoundingClientRect();
          const nav = 88;
          const traveled = nav - rect.top;
          const range = Math.max(1, node.offsetHeight - window.innerHeight + nav);
          const progress = Math.min(1, Math.max(0, traveled / range));
          const next = Math.min(
            lifecycleSteps.length - 1,
            Math.floor(progress * lifecycleSteps.length),
          );
          setActive(next);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        stop = () => window.removeEventListener("scroll", onScroll);
        return;
      }

      const nodes = el.querySelectorAll<HTMLElement>("[data-lifecycle-mobile]");
      const io = new IntersectionObserver(
        (entries) => {
          if (Date.now() < ignoreScroll.current) return;
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => Number(entry.target.getAttribute("data-index") || 0));
          if (!visible.length) return;
          setActive(Math.max(...visible));
        },
        { threshold: 0.55, rootMargin: "0px 0px -18% 0px" },
      );
      nodes.forEach((node) => io.observe(node));
      stop = () => io.disconnect();
    }

    bind();
    desktopMq.addEventListener("change", bind);
    return () => {
      stop();
      desktopMq.removeEventListener("change", bind);
    };
  }, [armed, reduced]);

  function select(index: number) {
    ignoreScroll.current = Date.now() + 1200;
    setActive(index);
  }

  return (
    <div
      ref={rootRef}
      data-armed={armed ? "true" : "false"}
      className={cn("mkt-lifecycle", className)}
    >
      <div className="mkt-lifecycle-pin md:sticky md:top-20 md:z-10 md:bg-background md:py-2">
        <ol className="flex gap-1 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:gap-px md:overflow-visible md:rounded-xl md:border md:border-border md:bg-border">
          {lifecycleSteps.map((step, index) => (
            <li key={step.title} className="shrink-0 md:min-w-0">
              <button
                type="button"
                data-state={stepState(index, active)}
                onClick={() => select(index)}
                className={cn(
                  "mkt-lifecycle-step relative w-full rounded-full border border-border bg-card px-3 py-2 text-left md:rounded-none md:border-0 md:p-4 lg:p-5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <p className="mkt-lifecycle-index text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:text-xs">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-0.5 text-sm font-semibold tracking-tight text-primary md:mt-3 md:text-base">
                  {step.title}
                </p>
                <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground md:block">
                  {step.detail}
                </p>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div
            className="h-full bg-[var(--mkt-safety)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${((active + 1) / lifecycleSteps.length) * 100}%` }}
          />
        </div>
        <div className="mt-4">
          <LifecycleSnippet index={active} />
        </div>
      </div>

      <div className="mkt-lifecycle-runway hidden md:block" />

      <ol className="mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:hidden">
        {lifecycleSteps.map((step, index) => (
          <li
            key={step.title}
            data-lifecycle-mobile
            data-index={index}
            data-state={stepState(index, active)}
            className="mkt-lifecycle-step relative bg-card p-4"
          >
            <button type="button" className="w-full text-left" onClick={() => select(index)}>
              <p className="mkt-lifecycle-index text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-base font-semibold tracking-tight text-primary">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
