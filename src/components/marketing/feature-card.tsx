import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  body?: string;
  icon?: LucideIcon;
  className?: string;
};

export function FeatureCard({ title, body, icon: Icon, className }: FeatureCardProps) {
  return (
    <div className={cn("border-l-2 border-[var(--mkt-safety)] pl-4", className)}>
      {Icon ? <Icon className="mb-3 h-5 w-5 text-accent" aria-hidden /> : null}
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {body ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      ) : null}
    </div>
  );
}
