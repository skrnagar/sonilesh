import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex">
            <BrandLockup size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Setup
            </p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-10 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mkt-safety)]">
          {step}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-md)] md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
