'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect }       from 'react'
import { Search, Filter, X, ChevronDown, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Badge }  from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RequestStatus } from '@prisma/client'
import type { RequestFiltersType } from './types'

const STATUS_OPTIONS: { value: RequestStatus | ''; label: string; color: string }[] = [
  { value: '',             label: 'All statuses',  color: '' },
  { value: 'SUBMITTED',   label: 'Submitted',      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'IN_REVIEW',   label: 'In Review',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'QUOTED',      label: 'Quoted',         color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { value: 'APPROVED',    label: 'Approved',       color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'REJECTED',    label: 'Rejected',       color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { value: 'IN_PRODUCTION', label: 'In Production', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'SHIPPED',     label: 'Shipped',        color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'COMPLETED',   label: 'Completed',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
]

const PRIORITY_OPTIONS = [
  { value: '',  label: 'All priorities' },
  { value: '5', label: '🔴 Critical (5)' },
  { value: '4', label: '🟠 High (4)' },
  { value: '3', label: '🟡 Medium (3)' },
  { value: '2', label: '🔵 Normal (2)' },
  { value: '1', label: '⚪ Low (1)' },
  { value: '0', label: '⬛ Minimal (0)' },
]

interface Props {
  initialFilters: RequestFiltersType
}

export function RequestFilters({ initialFilters }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search,    setSearch]    = useState(initialFilters.search ?? '')
  const [status,    setStatus]    = useState(initialFilters.status ?? '')
  const [priority,  setPriority]  = useState(initialFilters.priority?.toString() ?? '')
  const [dateFrom,  setDateFrom]  = useState(initialFilters.createdAtFrom ? new Date(initialFilters.createdAtFrom).toISOString().slice(0, 10) : '')
  const [dateTo,    setDateTo]    = useState(initialFilters.createdAtTo   ? new Date(initialFilters.createdAtTo).toISOString().slice(0, 10)   : '')
  const [showExtra, setShowExtra] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => applyFilters({ search }), 350)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const applyFilters = (overrides: Partial<{
    search: string; status: string; priority: string; dateFrom: string; dateTo: string
  }> = {}) => {
    const merged = { search, status, priority, dateFrom, dateTo, ...overrides }
    const p = new URLSearchParams(params)
    p.set('page', '1')

    merged.search   ? p.set('search', merged.search)        : p.delete('search')
    merged.status   ? p.set('status', merged.status)        : p.delete('status')
    merged.priority ? p.set('priority', merged.priority)    : p.delete('priority')
    merged.dateFrom ? p.set('createdAtFrom', merged.dateFrom) : p.delete('createdAtFrom')
    merged.dateTo   ? p.set('createdAtTo',   merged.dateTo)   : p.delete('createdAtTo')

    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  const handleStatus = (v: string) => {
    setStatus(v)
    applyFilters({ status: v })
  }
  const handlePriority = (v: string) => {
    setPriority(v)
    applyFilters({ priority: v })
  }
  const handleDates = () => applyFilters()

  const resetAll = () => {
    setSearch(''); setStatus(''); setPriority(''); setDateFrom(''); setDateTo('')
    startTransition(() => router.push(pathname))
  }

  const activeCount = [
    search, status, priority, dateFrom, dateTo,
  ].filter(Boolean).length

  const currentStatus = STATUS_OPTIONS.find(o => o.value === status)

  return (
    <div className="space-y-3">
      {/* Main row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, description, link…"
            className="pl-9 h-9 text-sm bg-card/50 border-border/50"
          />
          {search && (
            <Button onClick={() => { setSearch(''); applyFilters({ search: '' }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </Button>
          )}
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"
              className={`h-9 gap-1.5 text-sm border-border/50 bg-card/50 ${status ? 'border-color/40 text-color' : ''}`}>
              {currentStatus?.value
                ? <Badge variant="outline" className={`text-xs ${currentStatus.color}`}>{currentStatus.label}</Badge>
                : <><Filter size={13} /> Status</>}
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover border-border w-48">
            {STATUS_OPTIONS.map(o => (
              <DropdownMenuItem key={o.value} onClick={() => handleStatus(o.value)}
                className={`text-sm cursor-pointer ${status === o.value ? 'text-color' : ''}`}>
                {o.value
                  ? <Badge variant="outline" className={`text-xs ${o.color}`}>{o.label}</Badge>
                  : o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm"
              className={`h-9 gap-1.5 text-sm border-border/50 bg-card/50 ${priority ? 'border-color/40 text-color' : ''}`}>
              {PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? 'Priority'}
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover border-border">
            {PRIORITY_OPTIONS.map(o => (
              <DropdownMenuItem key={o.value} onClick={() => handlePriority(o.value)}
                className={`text-sm cursor-pointer ${priority === o.value ? 'text-color' : ''}`}>
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle extra filters */}
        <Button variant="ghost" size="sm"
          onClick={() => setShowExtra(p => !p)}
          className={`h-9 text-sm gap-1.5 ${showExtra ? 'text-color' : 'text-muted-foreground'}`}>
          <Filter size={13} /> Dates
          {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-color" />}
        </Button>

        {/* Reset */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetAll}
            className="h-9 text-muted-foreground hover:text-foreground gap-1.5 text-sm">
            <X size={13} /> Reset ({activeCount})
          </Button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <RefreshCw size={15} className="animate-spin text-muted-foreground ml-1" />
        )}
      </div>

      {/* Expanded date filters */}
      {showExtra && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">Created between:</span>
          <Input
            type="date" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-36 h-8 text-xs bg-card/50 border-border/50"
          />
          <span className="text-muted-foreground text-xs">and</span>
          <Input
            type="date" value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-36 h-8 text-xs bg-card/50 border-border/50"
          />
          <Button size="sm" onClick={handleDates}
            className="h-8 text-xs bg-color hover:bg-color/90 text-white">
            Apply dates
          </Button>
        </div>
      )}
    </div>
  )
}