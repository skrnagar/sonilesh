import { adoptionLoop } from "@/lib/marketing/content";

export function AdoptionLoop() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {adoptionLoop.map((step) => (
        <li
          key={step.title}
          className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mkt-safety)]">
            {step.step}
          </p>
          <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-foreground">
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
