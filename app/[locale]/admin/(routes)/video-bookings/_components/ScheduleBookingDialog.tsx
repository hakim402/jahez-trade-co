'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { scheduleBooking, getAvailableSlots } from '../actions'
import { MeetingProvider } from '@prisma/client'
import { formatDate, formatTime } from '@/lib/utils'
import type { BookingWithRelations } from './types'

const formSchema = z.object({
  slotId: z.string().min(1, 'Please select a slot'),
  meetingLink: z.string().url('Must be a valid URL'),
  meetingProvider: z.nativeEnum(MeetingProvider).optional(),
  adminNotes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ScheduleBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingWithRelations | null
  onSuccess: () => void
}

export function ScheduleBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: ScheduleBookingDialogProps) {
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meetingLink: '',
      adminNotes: '',
    },
  })

  useEffect(() => {
    if (open) {
      setLoading(true)
      getAvailableSlots()
        .then((result) => {
          if (result.success) {
            setSlots(result.data)
          } else {
            toast.error('Error', { description: result.error })
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const onSubmit = async (data: FormValues) => {
    if (!booking) return
    const result = await scheduleBooking({
      bookingId: booking.id,
      ...data,
    })
    if (result.success) {
      toast.success('Booking scheduled', { description: 'The booking has been scheduled.' })
      form.reset()
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Schedule Video Call</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="slotId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Slot *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {slots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {formatDate(slot.startTime)} {formatTime(slot.startTime)} -{' '}
                          {formatTime(slot.endTime)} ({slot.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://meet.google.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="meetingProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Provider (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MeetingProvider).map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any notes for the client..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Schedule
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}