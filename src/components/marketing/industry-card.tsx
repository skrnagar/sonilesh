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
        "group -mx-2 block rounded-xl border-b border-border px-2 py-5 transition-colors hover:bg-muted/50 sm:-mx-3 sm:px-3 motion-reduce:transition-none",
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
