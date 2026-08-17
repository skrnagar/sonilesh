import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  tone?: "default" | "inverse";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  tone = "default",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]",
            tone === "inverse" ? "text-teal-200/90" : "text-[var(--mkt-safety)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mkt-h2",
          tone === "inverse" ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mkt-body mt-4 text-base",
            tone === "inverse" ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
