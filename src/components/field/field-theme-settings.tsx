"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function FieldThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme ?? "light") : "light";

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Appearance
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={!mounted}
            aria-pressed={current === opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "min-h-11 rounded-xl border px-2 text-sm font-semibold transition-colors",
              current === opt.value
                ? "border-primary bg-primary text-white dark:text-[#071f2d]"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
