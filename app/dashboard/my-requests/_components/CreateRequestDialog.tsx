'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createRequest } from '../actions'

interface CreateRequestDialogProps {
  children: React.ReactNode
}

export function CreateRequestDialog({ children }: CreateRequestDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const result = await createRequest(formData)
      if (result.success) {
        toast.success('Request created successfully')
        setOpen(false)
        router.refresh()
      } else {
        toast.error('Failed to create request')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-150">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Product Request</DialogTitle>
            <DialogDescription>
              Fill out the details below to submit a new product sourcing request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productLink">Product Link (URL)</Label>
              <Input
                id="productLink"
                name="productLink"
                type="url"
                placeholder="https://example.com/product"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the product you need..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shippingCountry">Shipping Country</Label>
                <Input
                  id="shippingCountry"
                  name="shippingCountry"
                  placeholder="e.g., USA"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customNotes">Additional Notes</Label>
              <Textarea
                id="customNotes"
                name="customNotes"
                placeholder="Any special requirements..."
                rows={2}
              />
            </div>
            {/* File upload would go here, but omitted for simplicity */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}