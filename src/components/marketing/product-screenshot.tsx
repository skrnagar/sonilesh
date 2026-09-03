import { cn } from "@/lib/utils";

type ProductScreenshotProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  chrome?: boolean;
  stage?: boolean;
  /** Edge-to-edge hero plane — softer chrome, wider glow. */
  fullBleed?: boolean;
};

export function ProductScreenshot({
  title = "SONIL EHS360",
  children,
  className,
  chrome = true,
  stage = false,
  fullBleed = false,
}: ProductScreenshotProps) {
  const frame = (
    <div
      className={cn(
        "overflow-hidden border border-white/10 bg-[#071f2d] shadow-[var(--shadow-lg)] ring-1 ring-white/10",
        fullBleed ? "rounded-t-2xl rounded-b-none border-b-0 sm:rounded-t-[1.25rem]" : "rounded-xl",
        !stage && className,
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-2.5 sm:px-5">
          <span className="h-2 w-2 rounded-full bg-white/22" />
          <span className="h-2 w-2 rounded-full bg-white/16" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
          <span className="ml-3 truncate text-[11px] tracking-wide text-white/45">{title}</span>
        </div>
      ) : null}
      <div
        className={cn(
          "bg-[linear-gradient(180deg,#0b3a53_0%,#0f4a66_45%,#123f55_100%)]",
          fullBleed ? "p-2 sm:p-3 md:p-4" : "p-2.5 sm:p-3.5",
        )}
      >
        {children}
      </div>
    </div>
  );

  if (!stage) return frame;

  return (
    <div className={cn("relative min-w-0", fullBleed && "mkt-hero-stage", className)}>
      <div aria-hidden className={cn("mkt-product-glow", fullBleed && "mkt-product-glow-bleed")} />
      <div className={cn("mkt-product-tilt", fullBleed && "mkt-product-tilt-bleed")}>{frame}</div>
    </div>
  );
}
