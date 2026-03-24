"use client";

import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import CN from "country-flag-icons/react/3x2/CN";
import US from "country-flag-icons/react/3x2/US";
import SA from "country-flag-icons/react/3x2/SA";
import AE from "country-flag-icons/react/3x2/AE";
import YE from "country-flag-icons/react/3x2/YE";

const PINS = [
  { flag: CN, name: "China", x: 74, y: 38, color: "#ef4444" },
  { flag: US, name: "USA", x: 18, y: 36, color: "#3b82f6" },
  { flag: SA, name: "Saudi Arabia", x: 57, y: 44, color: "#10b981" },
  { flag: AE, name: "UAE", x: 60, y: 46, color: "#f59e0b" },
  { flag: YE, name: "Yemen", x: 59, y: 49, color: "#8b5cf6" },
];

export function ContactMap({ isAr }: { isAr: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Map header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#7b57fc]" />
        <span className="text-sm font-semibold text-foreground">
          {isAr ? "حضورنا العالمي" : "Our global presence"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {isAr ? "٥ مواقع نشطة" : "5 active locations"}
        </span>
      </div>

      {/* Embedded Google Map — Riyadh center, shows the whole Middle East + China region */}
      <div className="relative w-full" style={{ paddingBottom: "56%" }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d13000000!2d55!3d28!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
          className="absolute inset-0 w-full h-full grayscale dark:invert dark:hue-rotate-180 dark:brightness-75"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mewan operating locations"
        />

        {/* Pin overlays */}
        {PINS.map(({ flag: FlagComponent, name, x, y, color }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
            className="absolute flex flex-col items-center gap-0.5 z-10 pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-800"
              style={{ background: color }}
            >
              <FlagComponent className="w-4 h-4" />
            </div>
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: `6px solid ${color}`,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Pin legend */}
      <div className="px-4 py-3 border-t border-border/50 flex flex-wrap gap-2">
        {PINS.map(({ flag: FlagComponent, name, color }) => (
          <div key={name} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: color }}
            />
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <FlagComponent className="w-3 h-3" />
              {name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
