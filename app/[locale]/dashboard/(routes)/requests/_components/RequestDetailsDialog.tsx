'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { acceptQuote, rejectQuote } from '../actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ClientRequestWithRelations } from './types'

interface RequestDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ClientRequestWithRelations | null
  onActionComplete: () => void
}

export function RequestDetailsDialog({
  open,
  onOpenChange,
  request,
  onActionComplete,
}: RequestDetailsDialogProps) {
  if (!request) return null

  const handleAcceptQuote = async (quoteId: string) => {
    const result = await acceptQuote(quoteId)
    if (result.success) {
      toast.success('Quote accepted', { description: 'The quote has been accepted.' })
      onActionComplete()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  const handleRejectQuote = async (quoteId: string) => {
    const result = await rejectQuote(quoteId)
    if (result.success) {
      toast.success('Quote rejected', { description: 'The quote has been rejected.' })
      onActionComplete()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="quotes">Quotes ({request.quotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <p>{request.status}</p>
              </div>
              <div>
                <Label>Product Link</Label>
                <p>
                  <a
                    href={request.productLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {request.productLink || '—'}
                  </a>
                </p>
              </div>
              <div>
                <Label>Quantity</Label>
                <p>{request.quantity}</p>
              </div>
              <div>
                <Label>Shipping Country</Label>
                <p>{request.shippingCountry}</p>
              </div>
              <div>
                <Label>Created At</Label>
                <p>{formatDate(request.createdAt)}</p>
              </div>
            </div>
            {request.description && (
              <div>
                <Label>Description</Label>
                <p className="whitespace-pre-wrap">{request.description}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            {request.quotes.length === 0 ? (
              <p className="text-muted-foreground">No quotes yet.</p>
            ) : (
              request.quotes.map((quote) => (
                <div key={quote.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">
                        {formatCurrency(quote.price, quote.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({quote.status})
                      </span>
                    </div>
                    {quote.status === 'SENT' && !request.acceptedQuoteId && (
                      <div className="space-x-2">
                        <Button size="sm" onClick={() => handleAcceptQuote(quote.id)}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectQuote(quote.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {quote.status === 'SENT' && request.acceptedQuoteId && (
                      <span className="text-sm text-muted-foreground">
                        Another quote already accepted
                      </span>
                    )}
                  </div>
                  {quote.adminNotes && (
                    <p className="text-sm italic">{quote.adminNotes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created by {quote.createdBy.fullName} on {formatDate(quote.createdAt)}
                    {quote.validUntil && ` · Valid until ${formatDate(quote.validUntil)}`}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}