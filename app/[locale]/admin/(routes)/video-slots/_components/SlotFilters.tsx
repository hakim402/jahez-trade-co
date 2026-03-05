// app/[locale]/admin/(routes)/video-slots/_components/SlotFilters.tsx
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
import { useState } from 'react'

interface SlotFiltersProps {
  initialFilters: {
    startDateFrom?: Date
    startDateTo?: Date
    isActive?: boolean
    isBooked?: boolean
  }
}

export function SlotFilters({ initialFilters }: SlotFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [fromDate, setFromDate] = useState<Date | undefined>(initialFilters.startDateFrom)
  const [toDate, setToDate] = useState<Date | undefined>(initialFilters.startDateTo)
  const [isActive, setIsActive] = useState<string>(
    initialFilters.isActive === undefined ? '' : initialFilters.isActive.toString()
  )
  const [isBooked, setIsBooked] = useState<string>(
    initialFilters.isBooked === undefined ? '' : initialFilters.isBooked.toString()
  )

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')

    if (fromDate) params.set('startDateFrom', fromDate.toISOString())
    else params.delete('startDateFrom')

    if (toDate) params.set('startDateTo', toDate.toISOString())
    else params.delete('startDateTo')

    if (isActive) params.set('isActive', isActive)
    else params.delete('isActive')

    if (isBooked) params.set('isBooked', isBooked)
    else params.delete('isBooked')

    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setIsActive('')
    setIsBooked('')
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end bg-muted/50 p-4 rounded-lg">
      <div className="space-y-1">
        <label className="text-sm font-medium">From Date</label>
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
        <label className="text-sm font-medium">To Date</label>
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

      <div className="space-y-1">
        <label className="text-sm font-medium">Active</label>
        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger className="w-32.5">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Booked</label>
        <Select value={isBooked} onValueChange={setIsBooked}>
          <SelectTrigger className="w-32.5">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All</SelectItem>
            <SelectItem value="true">Booked</SelectItem>
            <SelectItem value="false">Free</SelectItem>
          </SelectContent>
        </Select>
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