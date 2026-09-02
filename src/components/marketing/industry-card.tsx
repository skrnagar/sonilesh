import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type IndustryCardProps = {
  name: string;
  summary: string;
  href: string;
  className?: string;
};

export function IndustryCard({ name, summary, href, className }: IndustryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-primary">{name}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none" />
      </div>
    </Link>
  );
}
