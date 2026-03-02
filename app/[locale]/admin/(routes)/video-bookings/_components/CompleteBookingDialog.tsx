'use client'

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
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { completeBooking } from '../actions'
import type { BookingWithRelations } from './types'

const formSchema = z.object({
  transcriptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  aiSummary: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CompleteBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingWithRelations | null
  onSuccess: () => void
}

export function CompleteBookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: CompleteBookingDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transcriptUrl: '',
      aiSummary: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    if (!booking) return
    const result = await completeBooking({
      bookingId: booking.id,
      ...data,
    })
    if (result.success) {
      toast.success('Booking completed', { description: 'The booking has been marked as completed.' })
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
          <DialogTitle>Complete Video Call</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transcriptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transcript URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aiSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Summary (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Summary of the call..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Complete</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}