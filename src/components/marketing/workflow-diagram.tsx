"use client";

import { useEffect, useRef, useState } from "react";
import { lifecycleSteps } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/marketing/use-prefers-reduced-motion";

function stepState(index: number, active: number, reduced: boolean) {
  if (reduced) return "done" as const;
  if (index < active) return "done" as const;
  if (index === active) return "active" as const;
  return "pending" as const;
}

export function WorkflowDiagram({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      setArmed(false);
      setActive(lifecycleSteps.length - 1);
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

  return (
    <div
      ref={rootRef}
      data-armed={armed ? "true" : "false"}
      className={cn("mkt-lifecycle", className)}
    >
      <div className="mkt-lifecycle-runway hidden md:block">
        <div className="mkt-lifecycle-pin md:sticky md:top-20 md:z-10 md:bg-background md:py-2">
          <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
            {lifecycleSteps.map((step, index) => (
              <li
                key={step.title}
                data-state={stepState(index, active, reduced)}
                className="mkt-lifecycle-step relative bg-card p-4 md:p-5"
              >
                <p className="mkt-lifecycle-index text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-base font-semibold tracking-tight text-primary">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-border" aria-hidden>
            <div
              className="h-full bg-[var(--mkt-safety)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `${((active + 1) / lifecycleSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:hidden">
        {lifecycleSteps.map((step, index) => (
          <li
            key={step.title}
            data-lifecycle-mobile
            data-index={index}
            data-state={stepState(index, active, reduced)}
            className="mkt-lifecycle-step relative bg-card p-4"
          >
            <p className="mkt-lifecycle-index text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-3 text-base font-semibold tracking-tight text-primary">{step.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
