'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Search, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

export function SubscriptionsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [plan, setPlan] = useState(searchParams.get('plan') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  )
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  )

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    if (status) params.set('status', status)
    if (from) params.set('from', from.toISOString())
    if (to) params.set('to', to.toISOString())
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const resetFilters = () => {
    setSearch('')
    setPlan('')
    setStatus('')
    setFrom(undefined)
    setTo(undefined)
    router.push('/admin/subscriptions')
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Search</label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Customer name, email, Stripe ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="w-full md:w-40 space-y-2">
        <label className="text-sm font-medium">Plan</label>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger><SelectValue placeholder="All plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All plans</SelectItem>
            {Object.values(SubscriptionPlan).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-44 space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(SubscriptionStatus).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Period end from</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full md:w-32 justify-start', !from && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from ? format(from, 'PP') : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Period end to</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full md:w-32 justify-start', !to && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {to ? format(to, 'PP') : <span>Pick date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={to} onSelect={setTo} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex gap-2 md:ml-auto">
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={resetFilters}>
          <X className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  )
}