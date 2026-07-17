'use client'

import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Activity,
  Sparkles,
  Pencil,
  Trash2,
  Bell,
  Megaphone,
  Calendar,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Coins,
  MoreHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import type { RecentActivity } from '../types'

interface RecentActivityFeedProps {
  activity: RecentActivity
}

// Map common action strings to Lucide icons
const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE: Sparkles,
  UPDATE: Pencil,
  DELETE: Trash2,
  SEND_NOTIFICATION: Bell,
  BROADCAST_NOTIFICATION: Megaphone,
  SCHEDULE: Calendar,
  COMPLETE: CheckCircle2,
  CANCEL: XCircle,
  APPROVE: ThumbsUp,
  REJECT: ThumbsDown,
  QUOTE: Coins,
}

function getActionIcon(action: string): React.ElementType {
  const upper = action.toUpperCase()
  for (const [key, Icon] of Object.entries(ACTION_ICONS)) {
    if (upper.includes(key)) return Icon
  }
  return MoreHorizontal
}

const ENTITY_COLORS: Record<string, string> = {
  ProductRequest: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  VideoBooking: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  Quote: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Notification: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  User: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
}

function getEntityColor(entity: string): string {
  return ENTITY_COLORS[entity] ?? 'bg-muted text-muted-foreground'
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  return (
    <Card className="border border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {activity.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 text-center text-sm text-muted-foreground"
          >
            No activity yet
          </motion.div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-border/50" />

            <motion.div
              className="space-y-0"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {activity.map((log, i) => {
                const initials = (log.admin.fullName ?? log.admin.email).slice(0, 2).toUpperCase()
                const isLast = i === activity.length - 1
                const ActionIcon = getActionIcon(log.action)

                return (
                  <motion.div
                    key={log.id}
                    variants={cardVariants}
                    className={cn(
                      'flex gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors',
                      !isLast && 'border-b border-border/20'
                    )}
                  >
                    {/* Avatar + icon */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Avatar className="h-7 w-7 z-10 ring-2 ring-background">
                        <AvatarFallback className="text-[10px] font-bold bg-muted">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="h-4 w-4 text-muted-foreground">
                        <ActionIcon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-xs font-medium text-foreground/80 leading-snug">
                          <span className="font-semibold text-foreground">
                            {log.admin.fullName ?? log.admin.email}
                          </span>
                          {' · '}
                          {formatAction(log.action)}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            className={cn(
                              'text-[9px] h-4 px-1.5 border-0 font-medium',
                              getEntityColor(log.entity)
                            )}
                          >
                            {log.entity}
                          </Badge>
                          {log.entityId && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              #{log.entityId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}