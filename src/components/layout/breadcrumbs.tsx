import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-xs", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="h-3 w-3 text-muted-foreground/70" aria-hidden />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "font-medium",
                  isLast ? "text-foreground" : "text-muted-foreground",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
