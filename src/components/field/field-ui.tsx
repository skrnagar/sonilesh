import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {title}
      </h1>
      {subtitle ? <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
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
        "rounded-[var(--radius-lg)] border border-border/90 bg-card p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldEmpty({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card/70 px-4 py-5 text-sm leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}

export function FieldDemoBanner({ message }: { message?: string }) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
      role="status"
    >
      <p className="font-medium text-primary">Demo preview</p>
      <p className="mt-1 text-muted-foreground">
        {message ??
          "Sample rows are shown because this demo tenant has no live data yet. Run npm run seed:demo to load full click-through data."}
      </p>
    </div>
  );
}

type StatusTone = "open" | "closed" | "neutral" | "warning" | "success";

const STATUS_TONE: Record<StatusTone, string> = {
  open: "bg-primary/15 text-primary",
  closed: "bg-muted text-muted-foreground",
  neutral: "bg-muted text-foreground",
  warning: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
  success: "bg-[var(--success-soft)] text-[var(--success-ink)]",
};

export function FieldStatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        STATUS_TONE[tone],
      )}
    >
      {label}
    </span>
  );
}

export function FieldForbidden() {
  return (
    <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-card/70 px-4 py-5 text-sm text-muted-foreground">
      You do not have permission for this action.
    </p>
  );
}

export function FieldError({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-ink)]">
      {text}
    </p>
  );
}

export const fieldControlClass =
  "w-full min-h-12 rounded-[var(--radius-md)] border border-border bg-card px-3.5 py-3 text-base text-foreground shadow-[var(--shadow-sm)] placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-200 hover:border-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const fieldPrimaryBtnClass =
  "flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.99] hover:bg-primary/90 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100";

export const fieldPrimaryBtnInlineClass =
  "inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)] transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.99] hover:bg-primary/90 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100";

export const fieldSecondaryBtnClass =
  "flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-muted disabled:opacity-60";

/** @deprecated Use fieldPrimaryBtnInlineClass — purple Raksha CTAs replaced by primary tokens. */
export const fieldRakshaBtnClass = fieldPrimaryBtnInlineClass;

export const fieldIconBtnClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-primary-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/90";

export const fieldHeaderBtnClass =
  "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border/80 bg-card text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Icon buttons on the white desktop field header (RAKSHA-style). */
export const fieldDesktopHeaderBtnClass =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function fieldHeaderInitials(name: string | null | undefined): string {
  return (
    (name ?? "")
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

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
        "interactive-lift flex min-h-12 items-center gap-3 rounded-[var(--radius-lg)] border border-border/90 bg-card px-3.5 py-3 shadow-[var(--shadow-sm)] active:scale-[0.99] motion-reduce:active:scale-100",
        wide && "col-span-2",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
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
    "block min-h-12 rounded-[var(--radius-lg)] border border-border/90 bg-card px-3.5 py-3 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 hover:border-accent/30";
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
        className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
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
          className="h-14 animate-pulse rounded-[var(--radius-lg)] border border-border bg-muted/70"
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
      <div className="raksha-module-panel space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-white/20" />
        <div className="h-7 w-48 animate-pulse rounded bg-white/20" />
        <div className="h-4 w-56 animate-pulse rounded bg-white/15" />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="raksha-module-tile h-[6.75rem] animate-pulse bg-white/90"
            />
          ))}
        </div>
      </div>
      <FieldSectionSkeleton title="Pending actions" />
      <FieldSectionSkeleton title="Permits" />
    </div>
  );
}

export function FieldPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-12 animate-pulse rounded-[var(--radius-md)] bg-muted/70" />
      <FieldListSkeleton rows={4} />
    </div>
  );
}
