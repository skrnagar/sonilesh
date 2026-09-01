import { RakshaLaunchpadGrid } from "@/components/navigation/raksha-launchpad-grid";
import type { ResolvedRakshaTile } from "@/lib/navigation/raksha-launchpad";
import { cn } from "@/lib/utils";

export function FieldLaunchpad({
  tiles,
  greeting,
  userName,
  siteName,
  projectName,
  className,
}: {
  tiles: ResolvedRakshaTile[];
  greeting: string;
  userName: string;
  siteName: string;
  projectName: string;
  className?: string;
}) {
  return (
    <section className={cn("raksha-module-panel space-y-4", className)}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">{greeting}</p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {userName}
        </h1>
        <p className="mt-1 truncate text-sm text-white/75">
          {siteName} · {projectName}
        </p>
      </div>
      <RakshaLaunchpadGrid tiles={tiles} />
    </section>
  );
}
