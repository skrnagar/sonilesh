import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 border border-dashed border-border bg-card px-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 border border-border bg-card px-6 text-center">
      <p className="text-sm font-semibold text-destructive">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function UpgradeState({
  featureName,
}: {
  featureName: string;
}) {
  return (
    <EmptyState
      title={`${featureName} is not available on your current plan`}
      description="Upgrade to unlock this module. Existing records stay in the database; new writes are blocked server-side until the plan includes this feature."
      action={
        <Button asChild>
          <Link href="/app/settings/subscription">Explore upgrade</Link>
        </Button>
      }
    />
  );
}

export function ForbiddenState() {
  return (
    <EmptyState
      title="You do not have permission"
      description="This action is blocked by your organization role permissions."
    />
  );
}
