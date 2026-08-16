import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
  stroke = "currentColor",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const width = 88;
  const height = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-[5.5rem] text-accent", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
