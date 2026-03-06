'use client'

import { motion } from 'framer-motion'
import {
  PackageSearch,
  Video,
  MessageSquareQuote,
  Users,
  MessageCircle,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import {
  getRequestStatus,
  getBookingStatus,
  formatCurrency,
  type DashboardStats,
} from '../types'

interface StatusBreakdownPanelProps {
  stats: DashboardStats
}

export function StatusBreakdownPanel({ stats }: StatusBreakdownPanelProps) {
  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Requests by status */}
      <StatusCard
        title="Requests"
        icon={PackageSearch}
        iconColor="text-blue-500"
        entries={Object.entries(stats.requests.byStatus)
          .filter(([, v]) => (v ?? 0) > 0)
          .map(([s, v]) => {
            const cfg = getRequestStatus(s)
            return { label: cfg.label, count: v ?? 0, dot: cfg.dot }
          })}
      />

      {/* Bookings by status */}
      <StatusCard
        title="Bookings"
        icon={Video}
        iconColor="text-sky-500"
        entries={Object.entries(stats.bookings.byStatus)
          .filter(([, v]) => (v ?? 0) > 0)
          .map(([s, v]) => {
            const cfg = getBookingStatus(s)
            return { label: cfg.label, count: v ?? 0, dot: cfg.dot }
          })}
      />

      {/* Quotes + value */}
      <motion.div variants={cardVariants}>
        <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquareQuote className="h-3.5 w-3.5 text-amber-500" />
              Quotes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {Object.entries(stats.quotes.byStatus)
                .filter(([, v]) => (v ?? 0) > 0)
                .map(([status, count]) => (
                  <motion.div
                    key={status}
                    variants={cardVariants}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {status.toLowerCase()}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] h-5 min-w-6 justify-center"
                    >
                      {count}
                    </Badge>
                  </motion.div>
                ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2 mt-2 border-t border-border/40 space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Accepted value
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.quotes.totalValue)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Pipeline
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(stats.quotes.pendingValue)}
                </span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users by role */}
      <motion.div variants={cardVariants}>
        <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-violet-500" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1.5">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {Object.entries(stats.users.byRole)
                .filter(([, v]) => (v ?? 0) > 0)
                .map(([role, count]) => (
                  <motion.div
                    key={role}
                    variants={cardVariants}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {role.toLowerCase()}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[11px] h-5 min-w-6 justify-center"
                    >
                      {count}
                    </Badge>
                  </motion.div>
                ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-2 mt-2 border-t border-border/40 space-y-1"
            >
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Active users
                </span>
                <span className="font-semibold">{stats.users.active}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <UserPlus className="h-3 w-3" /> New this week
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  +{stats.users.newThisWeek}
                </span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chats summary */}
      <motion.div variants={cardVariants}>
        <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              Chats
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {[
                { label: 'Total sessions', value: stats.chats.totalSessions, icon: MessageCircle },
                { label: 'Active sessions', value: stats.chats.activeSessions, icon: MessageCircle },
                { label: 'Total messages', value: stats.chats.totalMessages, icon: MessageCircle },
              ].map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label}
                  variants={cardVariants}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon className="h-3 w-3" /> {label}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[11px] h-5 min-w-6 justify-center"
                  >
                    {value.toLocaleString()}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC STATUS CARD (Enhanced with motion)
// ─────────────────────────────────────────────────────────────────────────────

function StatusCard({
  title,
  icon: Icon,
  iconColor,
  entries,
}: {
  title: string
  icon: React.ElementType
  iconColor: string
  entries: { label: string; count: number; dot: string }[]
}) {
  return (
    <motion.div variants={cardVariants}>
      <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Icon className={cn('h-3.5 w-3.5', iconColor)} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic">No data</p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {entries.map(({ label, count, dot }) => (
                <motion.div
                  key={label}
                  variants={cardVariants}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                    {label}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[11px] h-5 min-w-6 justify-center"
                  >
                    {count}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}