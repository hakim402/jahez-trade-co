"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { containerVariants, cardVariants } from "@/lib/motion";
import { formatCurrency, type RevenueBreakdown } from "../types";

interface RevenueChartProps {
  breakdown: RevenueBreakdown;
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
}

export function RevenueChart({
  breakdown,
  totalRevenue,
  revenueToday,
  revenueThisWeek,
}: RevenueChartProps) {
  // Last 14 days for sparkline
  const recent = breakdown.slice(-14);
  const maxRevenue = Math.max(...recent.map((d) => d.revenue), 1);

  // Week-over-week trend
  const thisWeekRev = breakdown.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const prevWeekRev = breakdown
    .slice(-14, -7)
    .reduce((s, d) => s + d.revenue, 0);
  const trendPct =
    prevWeekRev > 0 ? ((thisWeekRev - prevWeekRev) / prevWeekRev) * 100 : 0;
  const trendUp = trendPct >= 0;

  const statsCards = [
    {
      label: "Total",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "This Week",
      value: formatCurrency(revenueThisWeek),
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "Today",
      value: formatCurrency(revenueToday),
      icon: Wallet,
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-color" />{" "}
              {/* brand color */}
              Revenue Overview
            </CardTitle>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                trendUp
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
              )}
            >
              {trendUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trendPct).toFixed(1)}% WoW
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats row with staggered animation */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {statsCards.map(({ label, value, icon: Icon, gradient }) => (
              <motion.div
                key={label}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-lg bg-linear-to-br from-background to-muted/50 p-3 text-center border border-border/30 shadow-sm"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full bg-linear-to-br mx-auto mb-1 flex items-center justify-center",
                    gradient,
                  )}
                >
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums text-color">
                  {value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Sparkline bars with animated entrance */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Last 14 days
            </p>
            <div className="flex items-end gap-1 h-16">
              {recent.map((d, i) => {
                const heightPct =
                  maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                const isToday = i === recent.length - 1;
                return (
                  <motion.div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                  >
                    {/* Animated tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-foreground text-background text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap"
                      >
                        {d.date.slice(5)} · {formatCurrency(d.revenue)}
                      </motion.div>
                      <div className="border-4 border-transparent border-t-foreground -mt-0.5" />
                    </div>

                    <motion.div
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-300 min-h-0.5",
                        isToday
                          ? "bg-[#7b57fc]" // brand color for today
                          : d.revenue > 0
                            ? "bg-emerald-400/60 hover:bg-emerald-500"
                            : "bg-muted",
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, 4)}%` }}
                      transition={{ delay: i * 0.02, duration: 0.4 }}
                      whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent days table with staggered list animation */}
          <motion.div
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {breakdown
              .slice(-5)
              .reverse()
              .map((d, i) => (
                <motion.div
                  key={d.date}
                  variants={cardVariants}
                  whileHover={{
                    backgroundColor: "rgba(123, 87, 252, 0.05)",
                    x: 2,
                  }}
                  className="flex items-center justify-between text-xs p-1 rounded"
                >
                  <span className="text-muted-foreground">{d.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {d.attempts} payment{d.attempts !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums w-20 text-right",
                        d.revenue > 0
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatCurrency(d.revenue)}
                    </span>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
