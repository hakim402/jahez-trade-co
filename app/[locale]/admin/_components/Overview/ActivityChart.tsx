'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  TrendingUp, Users, Package, DollarSign,
  ArrowUpRight, ArrowDownRight, Minus,
  UserCheck, UserPlus, Shield, User,
  CheckCircle2, Clock, XCircle, Send,
  Bell, MessageCircle, Calendar, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import type { RevenueBreakdown, DashboardStats } from '../../actions/actions'

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  revenueData: RevenueBreakdown
  stats:       DashboardStats
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
function fmtN(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'revenue',  label: 'Revenue',  icon: DollarSign, gradient: ['#10b981', '#14b8a6'] },
  { id: 'users',    label: 'Users',    icon: Users,      gradient: ['#7b57fc', '#6366f1'] },
  { id: 'requests', label: 'Requests', icon: Package,    gradient: ['#3b82f6', '#06b6d4'] },
  { id: 'activity', label: 'Activity', icon: TrendingUp, gradient: ['#f59e0b', '#f97316'] },
] as const

type TabId = typeof TABS[number]['id']

// ─── Stat pill (enhanced with motion) ─────────────────────────────────────────
function StatPill({
  label, value, sub, trend, gradient,
}: {
  label: string; value: string; sub?: string
  trend?: 'up' | 'down' | 'neutral'; gradient: [string, string]
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-muted/30 border border-border/40 min-w-[110px] transition-all duration-200 hover:shadow-md"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p
        className="text-xl font-extrabold tabular-nums tracking-tight bg-clip-text text-transparent leading-tight"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      >
        {value}
      </p>
      {sub && (
        <div className={cn('flex items-center gap-0.5 text-[10px]', trendColor)}>
          <TrendIcon className="h-2.5 w-2.5" />
          {sub}
        </div>
      )}
    </motion.div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border/60 rounded-xl shadow-xl px-3.5 py-2.5 text-xs min-w-[130px]">
      <p className="text-muted-foreground font-medium mb-1.5 pb-1.5 border-b border-border/40">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}</span>
          </div>
          <span className="font-semibold text-foreground tabular-nums">
            {valuePrefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Revenue tab (enhanced with containerVariants) ────────────────────────────
function RevenueTab({ revenueData, stats }: Pick<Props, 'revenueData' | 'stats'>) {
  const chartData = revenueData.slice(-14).map(d => ({
    name:     shortDate(d.date),
    Revenue:  d.revenue,
    Payments: d.attempts,
  }))

  const totalRevenue  = revenueData.reduce((s, d) => s + d.revenue, 0)
  const totalPayments = revenueData.reduce((s, d) => s + d.attempts, 0)

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap gap-2">
        <StatPill label="Total Revenue" value={fmt$(totalRevenue)}       gradient={['#10b981','#14b8a6']} trend="up"     sub={`${fmt$(stats.payments.revenueToday)} today`} />
        <StatPill label="This Week"     value={fmt$(stats.payments.revenueThisWeek)} gradient={['#10b981','#14b8a6']} trend="up" sub="7-day total" />
        <StatPill label="MRR"           value={fmt$(stats.subscriptions.mrr)}        gradient={['#14b8a6','#0ea5e9']} trend="neutral" sub={`${stats.subscriptions.byStatus?.['ACTIVE'] ?? 0} active subs`} />
        <StatPill label="Payments"      value={fmtN(totalPayments)}      gradient={['#3b82f6','#06b6d4']} sub={`${stats.payments.byStatus?.['FAILED'] ?? 0} failed`} />
      </div>

      <motion.div variants={cardVariants}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPayments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} width={44} />
            <Tooltip content={<ChartTooltip valuePrefix="$" />} />
            <Area type="monotone" dataKey="Revenue"  stroke="#10b981" strokeWidth={2.5} fill="url(#gRevenue)"  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="Payments" stroke="#3b82f6" strokeWidth={2}   fill="url(#gPayments)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="flex items-center justify-center gap-5">
        {[['#10b981','Revenue'],['#3b82f6','Payment Count']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Users tab (enhanced) ─────────────────────────────────────────────────────
function UsersTab({ stats }: { stats: DashboardStats }) {
  const { users } = stats

  const roleData = Object.entries(users.byRole).map(([role, count]) => ({
    name:  role.charAt(0) + role.slice(1).toLowerCase(),
    value: count,
  }))
  const ROLE_COLORS = ['#7b57fc','#6366f1','#3b82f6','#06b6d4','#10b981']

  const radialData = [
    { name: 'Active',     value: users.active,      fill: '#7b57fc', total: users.total },
    { name: 'New Today',  value: users.newToday,    fill: '#10b981', total: users.total },
    { name: 'This Week',  value: users.newThisWeek, fill: '#3b82f6', total: users.total },
  ]

  const subData = Object.entries(stats.subscriptions.byStatus ?? {}).map(([status, count]) => ({
    name:  status.charAt(0) + status.slice(1).toLowerCase().replace('_',' '),
    value: count ?? 0,
  }))

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap gap-2">
        <StatPill label="Total Users"  value={fmtN(users.total)}       gradient={['#7b57fc','#6366f1']} />
        <StatPill label="Active"       value={fmtN(users.active)}      gradient={['#10b981','#14b8a6']} trend="up"     sub={`${Math.round(users.active/Math.max(users.total,1)*100)}% of total`} />
        <StatPill label="New Today"    value={fmtN(users.newToday)}    gradient={['#3b82f6','#06b6d4']} trend={users.newToday > 0 ? 'up' : 'neutral'} sub="since midnight" />
        <StatPill label="This Week"    value={fmtN(users.newThisWeek)} gradient={['#f59e0b','#f97316']} trend={users.newThisWeek > 0 ? 'up' : 'neutral'} sub="last 7 days" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">By Role</p>
          <div className="flex items-center gap-3">
            <PieChart width={90} height={90}>
              <Pie data={roleData} cx={40} cy={40} innerRadius={22} outerRadius={40} dataKey="value" strokeWidth={0}>
                {roleData.map((_, i) => (
                  <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-1 flex-1">
              {roleData.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                    <span className="text-[11px] text-muted-foreground truncate">{r.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground tabular-nums">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Activity</p>
          <div className="space-y-2.5 mt-1">
            {[
              { label: 'Active',     value: users.active,              max: users.total,  color: '#7b57fc', icon: UserCheck },
              { label: 'New Today',  value: users.newToday,            max: users.total,  color: '#10b981', icon: UserPlus  },
              { label: 'This Week',  value: users.newThisWeek,         max: users.total,  color: '#3b82f6', icon: User     },
              { label: 'Chats Open', value: stats.chats.activeSessions, max: stats.chats.totalSessions || 1, color: '#f59e0b', icon: Shield },
            ].map(({ label, value, max, color, icon: Icon }) => {
              const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Icon className="h-2.5 w-2.5" style={{ color }} />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.25,0.46,0.45,0.94], delay: 0.1 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {subData.length > 0 && (
        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Subscriptions</p>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={subData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }} barSize={20}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {subData.map((_, i) => (
                  <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Requests tab (enhanced) ──────────────────────────────────────────────────
function RequestsTab({ stats }: { stats: DashboardStats }) {
  const { requests, quotes, bookings } = stats

  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    SUBMITTED:  { color: '#3b82f6', icon: Send },
    IN_REVIEW:  { color: '#f59e0b', icon: Clock },
    COMPLETED:  { color: '#10b981', icon: CheckCircle2 },
    REJECTED:   { color: '#ef4444', icon: XCircle },
    CANCELED:   { color: '#6b7280', icon: XCircle },
  }

  const reqStatusData = Object.entries(requests.byStatus).map(([s, c]) => ({
    name: s.charAt(0) + s.slice(1).toLowerCase().replace('_',' '),
    value: c ?? 0,
    color: statusConfig[s]?.color ?? '#7b57fc',
  }))

  const quoteStatusData = Object.entries(quotes.byStatus).map(([s, c]) => ({
    name: s.charAt(0) + s.slice(1).toLowerCase(),
    value: c ?? 0,
  }))
  const Q_COLORS = ['#7b57fc','#3b82f6','#10b981','#f59e0b','#ef4444']

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap gap-2">
        <StatPill label="Total Requests" value={fmtN(requests.total)}    gradient={['#3b82f6','#06b6d4']} />
        <StatPill label="New Today"      value={fmtN(requests.newToday)} gradient={['#7b57fc','#6366f1']} trend={requests.newToday > 0 ? 'up' : 'neutral'} sub="since midnight" />
        <StatPill label="Total Quotes"   value={fmtN(quotes.total)}      gradient={['#f59e0b','#f97316']} sub={`${fmt$(quotes.pendingValue)} pending`} />
        <StatPill label="Bookings"       value={fmtN(bookings.total)}    gradient={['#ec4899','#f43f5e']} sub={`${bookings.upcoming?.length ?? 0} upcoming`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Request Status</p>
          <div className="space-y-2">
            {reqStatusData.map(({ name, value, color }) => {
              const pct = Math.min(100, Math.round((value / Math.max(requests.total, 1)) * 100))
              const Icon = statusConfig[name.toUpperCase().replace(' ','_')]?.icon ?? Package
              return (
                <div key={name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-2.5 w-2.5" style={{ color }} />
                      <span className="text-[10px] text-muted-foreground capitalize">{name}</span>
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.25,0.46,0.45,0.94] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Quote Value</p>
          <div className="flex flex-col gap-2 mt-1">
            {[
              { label: 'Accepted', value: quotes.totalValue,   color: '#10b981' },
              { label: 'Pending',  value: quotes.pendingValue, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color }}>{fmt$(value)}</span>
              </div>
            ))}

            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-1">Booking Types</p>
            {Object.entries(bookings.byType).map(([type, count], i) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: Q_COLORS[i % Q_COLORS.length] }} />
                  <span className="text-[11px] text-muted-foreground capitalize">{type.toLowerCase().replace('_',' ')}</span>
                </div>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: Q_COLORS[i % Q_COLORS.length] }}>{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Activity tab (enhanced) ──────────────────────────────────────────────────
function ActivityTab({ stats }: { stats: DashboardStats }) {
  const { notifications, chats, bookings, payments } = stats

  const activityItems = [
    {
      label:   'Unread Notifications',
      value:   notifications.unread,
      total:   notifications.total,
      sub:     `${notifications.sentToday} sent today`,
      color:   '#ef4444',
      icon:    Bell,
    },
    {
      label:   'Active Chat Sessions',
      value:   chats.activeSessions,
      total:   chats.totalSessions,
      sub:     `${fmtN(chats.totalMessages)} total messages`,
      color:   '#7b57fc',
      icon:    MessageCircle,
    },
    {
      label:   'Upcoming Bookings',
      value:   bookings.upcoming?.length ?? 0,
      total:   bookings.total,
      sub:     `${bookings.byStatus?.['REQUESTED'] ?? 0} awaiting`,
      color:   '#3b82f6',
      icon:    Calendar,
    },
    {
      label:   'Failed Payments',
      value:   payments.byStatus?.['FAILED'] ?? 0,
      total:   payments.totalAttempts,
      sub:     `${payments.totalAttempts} total attempts`,
      color:   '#f59e0b',
      icon:    AlertCircle,
    },
  ]

  const notifData = [
    { name: 'Unread', value: notifications.unread },
    { name: 'Read',   value: Math.max(0, notifications.total - notifications.unread) },
  ]

  const paymentData = Object.entries(payments.byStatus).map(([s, c]) => ({
    name:  s.charAt(0) + s.slice(1).toLowerCase(),
    value: c ?? 0,
  }))
  const P_COLORS = ['#10b981','#ef4444','#f59e0b','#3b82f6','#7b57fc']

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap gap-2">
        <StatPill label="Notifications"  value={fmtN(notifications.total)}   gradient={['#ef4444','#f97316']} sub={`${notifications.unread} unread`} trend={notifications.unread > 0 ? 'up' : 'neutral'} />
        <StatPill label="Chat Sessions"  value={fmtN(chats.totalSessions)}   gradient={['#7b57fc','#6366f1']} sub={`${chats.activeSessions} live`} />
        <StatPill label="Chat Messages"  value={fmtN(chats.totalMessages)}   gradient={['#3b82f6','#06b6d4']} />
        <StatPill label="Payment Tries"  value={fmtN(payments.totalAttempts)} gradient={['#f59e0b','#f97316']} sub={`${payments.byStatus?.['FAILED'] ?? 0} failed`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Notifications</p>
          <div className="flex items-center gap-3">
            <PieChart width={88} height={88}>
              <Pie data={notifData} cx={40} cy={40} innerRadius={24} outerRadius={40} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                <Cell fill="#ef4444" />
                <Cell fill="var(--muted)" />
              </Pie>
            </PieChart>
            <div className="space-y-2">
              {notifData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: i === 0 ? '#ef4444' : 'var(--muted-foreground)' }} />
                    <span className="text-[11px] text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums text-foreground">{d.value}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60">{notifications.sentToday} sent today</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Payment Status</p>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={paymentData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }} barSize={16}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={P_COLORS[i % P_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[11px] text-muted-foreground/60 mt-2">No payment data</p>
          )}
        </motion.div>
      </div>

      <motion.div variants={cardVariants}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Live Metrics</p>
        <div className="grid grid-cols-2 gap-2">
          {activityItems.map(({ label, value, total, sub, color }) => {
            const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100))
            return (
              <div key={label} className="rounded-xl bg-muted/30 border border-border/30 px-3 py-2.5">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
                </div>
                <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.25,0.46,0.45,0.94] }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60">{sub}</p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main component (enhanced) ────────────────────────────────────────────────
export function ActivityChart({ revenueData, stats }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('revenue')
  const active = TABS.find(t => t.id === activeTab)!

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:shadow-xl">
        {/* Header */}
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Title */}
            <div className="flex items-center gap-2.5">
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-xl shadow-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${active.gradient[0]}, ${active.gradient[1]})` }}
              >
                <active.icon className="h-4 w-4 text-white" />
                <div
                  className="absolute inset-0 rounded-xl blur-sm opacity-40"
                  style={{ background: `linear-gradient(135deg, ${active.gradient[0]}, ${active.gradient[1]})` }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">Dashboard Analytics</h3>
                <p className="text-[11px] text-muted-foreground">Live data · updates on load</p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/50 border border-border/40 self-start sm:self-auto">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="tab-bg"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: `linear-gradient(135deg, ${tab.gradient[0]}, ${tab.gradient[1]})` }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <tab.icon className="relative h-3 w-3" />
                    <span className="relative hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="px-5 pt-4 pb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'revenue'  && <RevenueTab  revenueData={revenueData} stats={stats} />}
              {activeTab === 'users'    && <UsersTab    stats={stats} />}
              {activeTab === 'requests' && <RequestsTab stats={stats} />}
              {activeTab === 'activity' && <ActivityTab stats={stats} />}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}