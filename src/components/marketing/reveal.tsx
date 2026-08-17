"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/components/marketing/use-prefers-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

function useArmedInView<T extends HTMLElement>(rootMargin = "160px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (reduced) {
      setInView(true);
      setPending(false);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setPending(false);
          io.disconnect();
          return;
        }
        setPending(true);
      },
      { rootMargin, threshold: 0.08 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rootMargin]);

  return { ref, inView, pending: pending && !inView && !reduced };
}

export function Reveal({ children, className }: RevealProps) {
  const { ref, inView, pending } = useArmedInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("mkt-reveal", pending && "mkt-reveal-pending", inView && "is-inview", className)}
    >
      {children}
    </div>
  );
}

export function Stagger({ children, className }: RevealProps) {
  const { ref, inView, pending } = useArmedInView<HTMLDivElement>("200px 0px -6% 0px");

  return (
    <div
      ref={ref}
      className={cn(
        "mkt-stagger",
        pending && "mkt-stagger-pending",
        inView && "is-inview",
        className,
      )}
    >
      {children}
    </div>
  );
}
