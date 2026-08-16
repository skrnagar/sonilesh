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
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
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
  "flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--mkt-safety)] px-4 py-4 text-sm font-semibold text-[var(--mkt-safety-ink)] shadow-[var(--shadow-md)] transition-transform active:scale-[0.99] disabled:opacity-60 motion-reduce:transition-none";

export const fieldSecondaryBtnClass =
  "flex min-h-14 w-full items-center justify-center rounded-2xl border border-border bg-card px-4 py-4 text-sm font-semibold text-foreground shadow-[var(--shadow-sm)] transition-colors hover:bg-muted disabled:opacity-60";

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
}: {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  tone: "navy" | "green" | "amber" | "red";
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-transform active:scale-[0.99] motion-reduce:transition-none",
        wide && "col-span-2",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
          TONE[tone],
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-base font-semibold text-foreground">{label}</span>
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
    "block rounded-2xl border border-border bg-card px-3.5 py-3.5 shadow-[var(--shadow-sm)]";
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
