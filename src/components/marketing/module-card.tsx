import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleCardProps = {
  name: string;
  summary: string;
  href: string;
  className?: string;
};

export function ModuleCard({ name, summary, href, className }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-card p-5 transition-[border-color,background-color,box-shadow] duration-150 hover:border-accent/45 hover:bg-[#f8fafc] hover:shadow-[var(--shadow-sm)] motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-primary">{name}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </Link>
  );
}
