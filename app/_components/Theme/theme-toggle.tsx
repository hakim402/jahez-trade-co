"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder to prevent layout shift
    return <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={cn(
        "relative p-1 rounded-lg border border-border bg-white/90 dark:bg-black/90 hover:bg-accent transition-colors focus-ring cursor-pointer",
        className
      )}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <div>
        {isLight ? (
          <HiMoon className="w-5 h-5 text-black" />
        ) : (
          <HiSun className="w-5 h-5 text-yellow-400" />
        )}
      </div>
    </button>
  );
}
