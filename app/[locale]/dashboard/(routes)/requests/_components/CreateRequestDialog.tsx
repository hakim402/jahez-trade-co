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
import { createProductRequest } from '../actions'

const formSchema = z.object({
  productLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  shippingCountry: z.string().min(1, 'Shipping country is required'),
  customNotes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRequestDialog({ open, onOpenChange, onSuccess }: CreateRequestDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productLink: '',
      description: '',
      quantity: 1,
      shippingCountry: '',
      customNotes: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    const result = await createProductRequest(data)
    if (result.success) {
      toast.success('Request created', { description: 'Your request has been submitted.' })
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
          <DialogTitle>Create New Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Link (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what you need..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shippingCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Country</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}