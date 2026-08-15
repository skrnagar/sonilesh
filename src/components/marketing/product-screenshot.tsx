import { cn } from "@/lib/utils";

type ProductScreenshotProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  chrome?: boolean;
};

export function ProductScreenshot({
  title = "EHS360",
  children,
  className,
  chrome = true,
}: ProductScreenshotProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/10 bg-[#071f2d] shadow-[var(--shadow-lg)] ring-1 ring-white/5",
        className,
      )}
    >
      {chrome ? (
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
          <span className="ml-3 truncate text-xs text-white/50">{title}</span>
        </div>
      ) : null}
      <div className="bg-[linear-gradient(180deg,#0b3a53_0%,#0f4a66_45%,#123f55_100%)] p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
}
