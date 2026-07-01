// app/[locale]/_components/Language/LanguageSwitcher.tsx

"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import GB from "country-flag-icons/react/3x2/GB";
import SA from "country-flag-icons/react/3x2/SA";

// ─────────────────────────────────────────────────────────────────────────────

const LOCALES = [
  { value: "en", label: "English", flag: GB, short: "EN" },
  { value: "ar", label: "العربية", flag: SA, short: "AR" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];
  const FlagComponent = active.flag;

  const handleChange = (newLocale: string) => {
    if (newLocale === locale) {
      setOpen(false);
      return;
    }

    // Full page reload on locale switch (not router.push).
    // The root layout renders a <script type="application/ld+json"> whose
    // content (name/description) differs per locale. A soft/client-side
    // navigation keeps that layout mounted and asks React to patch the
    // script's content on the client — which React explicitly disallows
    // for <script> tags, producing the console error. A hard navigation
    // makes the whole page — including the correct script — come straight
    // from the server, avoiding the issue entirely. This also matches how
    // most production sites handle language switches, since providers like
    // Clerk's localization and web fonts benefit from a fresh boot too.
    const targetPath =
      pathname === "/" ? `/${newLocale}` : `/${newLocale}${pathname}`;

    setOpen(false);
    window.location.href = targetPath;
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold",
          "text-muted-foreground hover:text-foreground",
          "border border-transparent hover:border-border/15",
          "hover:bg-muted/20 transition-all duration-150",
          open && "bg-muted/20 border-border/15 text-foreground",
        )}
      >
        <FlagComponent className="w-4 h-4 shrink-0" />
        <span className="hidden sm:block tracking-wide">{active.short}</span>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-border/15 bg-card/95 backdrop-blur-xl shadow-2xl p-1 z-50"
          >
            {LOCALES.map((l) => {
              const isActive = l.value === locale;
              const ItemFlag = l.flag;
              return (
                <button
                  key={l.value}
                  onClick={() => handleChange(l.value)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left",
                    isActive
                      ? "bg-color/10 text-color"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                >
                  <ItemFlag className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{l.label}</span>
                  {isActive && (
                    <Check size={11} className="text-color shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}