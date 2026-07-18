"use client";

import Link from "next/link";
import { motion, Variants } from "motion/react";
import {
  ArrowUpRight,
  Users,
  PackageOpen,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, type DashboardStats } from "../types";
import { containerVariants, cardVariants } from "@/lib/motion";

interface AdminKpiCardsProps {
  stats: DashboardStats;
}

export function AdminKpiCards({ stats }: AdminKpiCardsProps) {
  const cards = [
    {
      label: "Total Users",
      value: formatNumber(stats.users.total),
      sub: `+${stats.users.newToday} today`,
      gradient: "from-[#7b57fc] to-indigo-600", // uses brand + indigo
      icon: Users,
      href: "/admin/manage-users",
      urgent: false,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.payments.totalRevenue),
      sub: `${formatCurrency(stats.payments.revenueToday)} today`,
      gradient: "from-emerald-500 to-teal-500",
      icon: DollarSign,
      href: "/admin/manage-users",
      urgent: false,
    },
    {
      label: "Monthly MRR",
      value: formatCurrency(stats.subscriptions.mrr),
      sub: `${stats.subscriptions.byStatus?.["ACTIVE"] ?? 0} active subs`,
      gradient: "from-pink-500 to-rose-500",
      icon: TrendingUp,
      href: "/admin/manage-users",
      urgent: false,
    },

    {
      label: "Open Requests",
      value: formatNumber(
        (stats.requests.byStatus["SUBMITTED"] ?? 0) +
          (stats.requests.byStatus["IN_REVIEW"] ?? 0),
      ),
      sub: `${stats.requests.newToday} new today`,
      gradient: "from-blue-500 to-cyan-500",
      icon: PackageOpen,
      href: "/admin/product-requests",
      urgent: (stats.requests.byStatus["IN_REVIEW"] ?? 0) > 0,
    },
    {
      label: "Pending Quotes",
      value: formatNumber(stats.quotes.byStatus["SENT"] ?? 0),
      sub: `${formatCurrency(stats.quotes.pendingValue)} pipeline`,
      gradient: "from-amber-500 to-orange-500",
      icon: FileText,
      href: "/admin/product-requests",
      urgent: (stats.quotes.byStatus["SENT"] ?? 0) > 0,
    },
    {
      label: "Upcoming Bookings",
      value: formatNumber(stats.bookings.upcoming?.length ?? 0),
      sub: `${stats.bookings.byStatus["REQUESTED"] ?? 0} awaiting schedule`,
      gradient: "from-sky-500 to-blue-500",
      icon: Calendar,
      href: "/admin/video-bookings",
      urgent: (stats.bookings.byStatus["REQUESTED"] ?? 0) > 0,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-col-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={cardVariants}>
            <Link href={card.href} className="group block">
              <Card
                className={cn(
                  "relative overflow-hidden border border-border/50 transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-1",
                  card.urgent &&
                    "ring-1 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse",
                )}
              >
                {/* Background gradient orb */}
                <div
                  className={cn(
                    "absolute -top-5 -right-5 h-20 w-20 rounded-full opacity-15 blur-2xl transition-all group-hover:opacity-20",
                    `bg-linear-to-br ${card.gradient}`,
                  )}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "rounded-lg p-2 bg-linear-to-br text-white shadow-sm",
                        card.gradient,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 transition-all group-hover:text-muted-foreground/50" />
                  </div>
                  <div className="mt-3">
                    <p
                      className={cn(
                        "text-2xl font-bold tabular-nums tracking-tight",
                        card.urgent &&
                          `bg-linear-to-br ${card.gradient} bg-clip-text text-transparent`,
                      )}
                    >
                      {card.value}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {card.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 mt-3">
                    {card.sub}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
