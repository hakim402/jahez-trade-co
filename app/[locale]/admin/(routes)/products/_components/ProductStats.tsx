"use client"

// app/[locale]/admin/(routes)/products/_components/product-stats.tsx

import { motion } from "motion/react"
import {
  Package,
  ToggleLeft,
  Star,
  Eye,
  MessageSquare,
  TrendingUp,
} from "lucide-react"

interface StatsProps {
  stats: {
    total: number
    active: number
    inactive: number
    featured: number
    totalViews: number
    totalInquiries: number
  }
}

const KPI_CARDS = [
  {
    key: "total" as const,
    label: "Total Products",
    icon: Package,
    gradient: "from-violet-500 to-[#7b57fc]",
    shadow: "shadow-violet-500/20",
  },
  {
    key: "active" as const,
    label: "Active",
    icon: ToggleLeft,
    gradient: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/20",
  },
  {
    key: "featured" as const,
    label: "Featured",
    icon: Star,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-500/20",
  },
  {
    key: "totalInquiries" as const,
    label: "Inquiries",
    icon: MessageSquare,
    gradient: "from-pink-500 to-rose-500",
    shadow: "shadow-pink-500/20",
  },
] as const

export function ProductStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      {KPI_CARDS.map(({ key, label, icon: Icon, gradient, shadow }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
          className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden p-4 flex items-center gap-3.5 hover:border-border transition-all duration-300"
        >
          {/* hover glow blob */}
          <div
            className={`absolute -top-4 -right-4 h-16 w-16 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-br ${gradient}`}
          />
          <div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md ${shadow}`}
          >
            <Icon size={17} className="text-white" />
          </div>
          <div className="relative min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">
              {label}
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">
              {stats[key].toLocaleString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}