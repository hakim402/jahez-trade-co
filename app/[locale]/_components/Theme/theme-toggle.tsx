"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

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
    <>
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => setTheme(isLight ? "dark" : "light")}
        className="text-color cursor-pointer"
      >
        {isLight ? <Moon size={20} /> : <Sun size={20} />}
        
      </Button>
    </>
  );
}
