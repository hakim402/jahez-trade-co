'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { PackageSearch, ArrowRight, Globe, Hash, Star, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { containerVariants, cardVariants } from '@/lib/motion'
import { getRequestStatus, type DashboardStats } from '../types'

type RecentRequest = DashboardStats['requests']['recent'][number]

interface RecentRequestsTableProps {
  requests: RecentRequest[]
  total: number
}

export function RecentRequestsTable({ requests, total }: RecentRequestsTableProps) {
  return (
    <Card className="border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-[#7b57fc]" /> {/* brand color */}
            Recent Requests
          </CardTitle>
          <Badge variant="secondary" className="font-mono text-xs h-5">
            {total}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 text-center text-sm text-muted-foreground"
          >
            No requests yet
          </motion.div>
        ) : (
          <motion.div
            className="divide-y divide-border/40"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {requests.map((r) => {
              const cfg = getRequestStatus(r.status)
              const initials = r.client
                ? r.client.fullName
                  ? r.client.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : r.client.email.slice(0, 2).toUpperCase()
                : 'GU'

              return (
                <motion.div
                  key={r.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.002, backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  {/* Client avatar */}
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                    <AvatarFallback className="text-[11px] font-semibold bg-muted">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="text-sm font-medium text-foreground truncate max-w-48">
                        {r.client ? (r.client.fullName ?? r.client.email) : 'Guest'}
                      </p>
                      <Badge
                        className={cn(
                          'shrink-0 text-[10px] h-5 px-1.5 border-0',
                          cfg.color,
                          cfg.textColor
                        )}
                      >
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {r.productLink && (
                        <a
                          href={r.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline truncate max-w-32 group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{new URL(r.productLink).hostname}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Hash className="h-2.5 w-2.5" />
                        {r.quantity}
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Globe className="h-2.5 w-2.5" />
                        {r.shippingCountry}
                      </span>

                      {r.priority > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          P{r.priority}
                        </span>
                      )}

                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </CardContent>

      <CardFooter className="pt-3 pb-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full h-8 text-xs text-muted-foreground gap-1.5 transition-all hover:gap-2.5"
        >
          <Link href="/admin/product-requests">
            View all requests <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}