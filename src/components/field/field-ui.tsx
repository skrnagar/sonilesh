import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldHeadingFace =
  "[font-family:var(--font-sans-face),ui-sans-serif,system-ui,sans-serif]";

export function FieldPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="space-y-1">
      <h1
        className={cn(
          "text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
          fieldHeadingFace,
        )}
      >
        {title}
      </h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function FieldMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-7 w-7 shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="8" fill="#071f2d" />
      <rect x="8" y="9" width="24" height="6" rx="1.25" fill="#5eead4" />
      <rect x="8" y="17" width="17" height="6" rx="1.25" fill="#2dd4bf" />
      <rect x="8" y="25" width="24" height="6" rx="1.25" fill="#0f766e" />
    </svg>
  );
}

export function FieldCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldEmpty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-5 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

export function FieldForbidden() {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-5 text-sm text-muted-foreground">
      You do not have permission for this action.
    </p>
  );
}

export function FieldError({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-ink)]">
      {text}
    </p>
  );
}

export const fieldControlClass =
  "w-full min-h-12 rounded-2xl border border-border bg-background px-3.5 py-3 text-base text-foreground shadow-[var(--shadow-sm)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const fieldPrimaryBtnClass =
  "flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--mkt-safety)] px-4 py-3 text-sm font-semibold text-[var(--mkt-safety-ink)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.99] disabled:opacity-60 motion-reduce:transition-none";

export const fieldSecondaryBtnClass =
  "flex min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-muted disabled:opacity-60";

export const fieldHeaderBtnClass =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted";

const TONE: Record<string, string> = {
  navy: "bg-[var(--sidebar-active)] text-primary",
  green: "bg-[var(--success-soft)] text-[var(--success-ink)]",
  amber: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
  red: "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
};

export function FieldActionLink({
  href,
  label,
  hint,
  icon: Icon,
  tone,
  wide,
  prefetch,
}: {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  tone: "navy" | "green" | "amber" | "red";
  wide?: boolean;
  prefetch?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-sm)] transition-transform active:scale-[0.99] motion-reduce:transition-none",
        wide && "col-span-2",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          TONE[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </Link>
  );
}

export function FieldRow({
  title,
  meta,
  href,
}: {
  title: string;
  meta: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{meta}</p>
    </>
  );
  const className =
    "block min-h-11 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-[var(--shadow-sm)]";
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground",
          fieldHeadingFace,
        )}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function FieldListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-2xl border border-border bg-muted/70"
        />
      ))}
    </div>
  );
}

export function FieldSectionSkeleton({ title, rows = 2 }: { title: string; rows?: number }) {
  return (
    <FieldSection title={title}>
      <FieldListSkeleton rows={rows} />
    </FieldSection>
  );
}

export function FieldHomeSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading field home">
      <div className="h-[5.5rem] animate-pulse rounded-2xl border border-border bg-muted/70" />
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl border border-border bg-muted/70"
          />
        ))}
      </div>
      <FieldSectionSkeleton title="Pending actions" />
      <FieldSectionSkeleton title="Permits" />
    </div>
  );
}

export function FieldPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-12 animate-pulse rounded-xl bg-muted/70" />
      <FieldListSkeleton rows={4} />
    </div>
  );
}
