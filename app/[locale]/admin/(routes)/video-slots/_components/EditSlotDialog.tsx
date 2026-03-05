// app/[locale]/admin/(routes)/video-slots/_components/EditSlotDialog.tsx
'use client'

import { useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateSlot } from '../actions'
import type { Slot } from './types'

const formSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  durationMinutes: z.coerce.number().int().positive(),
  isActive: z.boolean(),
})
  .refine(data => new Date(data.startTime) < new Date(data.endTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

type FormValues = z.infer<typeof formSchema>

interface EditSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: Slot | null
  onSuccess: () => void
}

export function EditSlotDialog({ open, onOpenChange, slot, onSuccess }: EditSlotDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: '',
      endTime: '',
      durationMinutes: 30,
      isActive: true,
    },
  })

  // Populate form when slot changes
  useEffect(() => {
    if (slot) {
      form.reset({
        startTime: slot.startTime.toISOString().slice(0, 16), // format for datetime-local
        endTime: slot.endTime.toISOString().slice(0, 16),
        durationMinutes: slot.durationMinutes,
        isActive: slot.isActive,
      })
    }
  }, [slot, form])

  const onSubmit = async (data: FormValues) => {
    if (!slot) return
    const result = await updateSlot({
      slotId: slot.id,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      durationMinutes: data.durationMinutes,
      isActive: data.isActive,
    })
    if (result.success) {
      toast.success('Slot updated', { description: 'The slot has been updated.' })
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
          <DialogTitle>Edit Slot</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive slots are not visible for booking
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}