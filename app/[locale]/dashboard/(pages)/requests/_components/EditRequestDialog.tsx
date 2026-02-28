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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateRequest } from '../actions'

interface EditRequestDialogProps {
  request: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRequestDialog({ request, open, onOpenChange }: EditRequestDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('id', request.id)

    try {
      const result = await updateRequest(formData)
      if (result.success) {
        toast.success('Request updated')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error('Failed to update')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
            <DialogDescription>
              Update your request details. You can only edit while status is "Submitted".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="productLink">Product Link (URL)</Label>
              <Input
                id="productLink"
                name="productLink"
                type="url"
                defaultValue={request.productLink || ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={request.description || ''}
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
                  defaultValue={request.quantity}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shippingCountry">Shipping Country</Label>
                <Input
                  id="shippingCountry"
                  name="shippingCountry"
                  defaultValue={request.shippingCountry}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customNotes">Additional Notes</Label>
              <Textarea
                id="customNotes"
                name="customNotes"
                defaultValue={request.customNotes || ''}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}