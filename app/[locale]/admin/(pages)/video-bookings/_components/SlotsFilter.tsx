'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { BookingType } from '@prisma/client'

export function SlotsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [type, setType] = useState(searchParams.get('type') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [isAvailable, setIsAvailable] = useState(searchParams.get('isAvailable') || '')
  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  )
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  )

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (location) params.set('location', location)
    if (isAvailable) params.set('isAvailable', isAvailable)
    if (from) params.set('from', from.toISOString())
    if (to) params.set('to', to.toISOString())
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const resetFilters = () => {
    setType('')
    setLocation('')
    setIsAvailable('')
    setFrom(undefined)
    setTo(undefined)
    router.push('/admin/video-bookings/slots')
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="w-full md:w-40 space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.values(BookingType).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input placeholder="Filter by location..." value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <div className="w-full md:w-44 space-y-2">
        <label className="text-sm font-medium">Availability</label>
        <Select value={isAvailable} onValueChange={setIsAvailable}>
          <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="true">Available</SelectItem>
            <SelectItem value="false">Booked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
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
          <label className="text-sm font-medium">To</label>
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