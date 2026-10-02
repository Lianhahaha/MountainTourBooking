"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const options: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "Device", icon: "monitor" },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Deferred so the mount flag is not set synchronously inside the effect.
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  return mounted;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <span className="block h-8 w-8" aria-hidden />;
  }

  const current = options.find((o) => o.value === theme) ?? options[1];
  const next = options[(options.indexOf(current) + 1) % options.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next.value)}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
      aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
      title={`Theme: ${current.label}`}
    >
      <Icon name={current.icon} className="h-[18px] w-[18px]" />
    </button>
  );
}

/** Explicit three-way theme picker for the mobile menu. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1"
    >
      {options.map((o) => {
        const active = mounted && theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-surface-elevated text-foreground shadow-[var(--shadow)]"
                : "text-muted hover:text-foreground"
            )}
          >
            <Icon name={o.icon} className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
