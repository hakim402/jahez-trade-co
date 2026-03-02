'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { BookingStatus } from '@prisma/client'
import { useState } from 'react'

interface BookingFiltersProps {
  initialFilters: {
    status?: string
    clientEmail?: string
    dateFrom?: Date
    dateTo?: Date
  }
}

export function BookingFilters({ initialFilters }: BookingFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState(initialFilters.status || '')
  const [clientEmail, setClientEmail] = useState(initialFilters.clientEmail || '')
  const [fromDate, setFromDate] = useState<Date | undefined>(initialFilters.dateFrom)
  const [toDate, setToDate] = useState<Date | undefined>(initialFilters.dateTo)

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')

    if (status) params.set('status', status)
    else params.delete('status')

    if (clientEmail) params.set('clientEmail', clientEmail)
    else params.delete('clientEmail')

    if (fromDate) params.set('dateFrom', fromDate.toISOString())
    else params.delete('dateFrom')

    if (toDate) params.set('dateTo', toDate.toISOString())
    else params.delete('dateTo')

    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    setStatus('')
    setClientEmail('')
    setFromDate(undefined)
    setToDate(undefined)
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end bg-muted/50 p-4 rounded-lg">
      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            {Object.values(BookingStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Client Email</label>
        <Input
          placeholder="Filter by email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="w-55"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Created from</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-50 justify-start text-left font-normal',
                !fromDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={setFromDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Created to</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-50 justify-start text-left font-normal',
                !toDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={setToDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={resetFilters}>
          <X className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  )
}