// app/[locale]/admin/product-quotes/_components/QuoteDetailsDialog.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Mail, Phone, FileText, Download, ExternalLink } from 'lucide-react';
import { getQuoteById, type GetQuoteByIdReturn } from '../actions';

const statusColorMap: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  SENT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACCEPTED: 'bg-green-500/10 text-green-600 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  EXPIRED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
};

interface QuoteDetailsDialogProps {
  quoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteDetailsDialog({ quoteId, open, onOpenChange }: QuoteDetailsDialogProps) {
  const [quote, setQuote] = useState<GetQuoteByIdReturn['quote'] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && quoteId) {
      setLoading(true);
      getQuoteById({ id: quoteId })
        .then((data) => setQuote(data.quote))
        .catch((error) => {
          toast.error('Failed to load quote details');
          console.error(error);
        })
        .finally(() => setLoading(false));
    } else {
      setQuote(null);
    }
  }, [quoteId, open]);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email.substring(0, 2).toUpperCase();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quote #{quote.id.slice(0, 8)}
            <Badge variant="outline" className={statusColorMap[quote.status]}>
              {quote.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created on {new Date(quote.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Price Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">{formatPrice(quote.price, quote.currency)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-lg">{new Date(quote.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Admin Notes */}
            {quote.adminNotes && (
              <div>
                <h3 className="text-sm font-medium mb-2">Admin Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {quote.adminNotes}
                </p>
              </div>
            )}

            {/* Quote File */}
            {quote.quoteFileUrl && (
              <div>
                <h3 className="text-sm font-medium mb-2">Quote Document</h3>
                <Button variant="outline" size="sm" asChild>
                  <a href={quote.quoteFileUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    View Quote File
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            <Separator />

            {/* Request Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Product Request</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-25">Product Link:</span>
                  {quote.request.productLink ? (
                    <a href={quote.request.productLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {quote.request.productLink}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium min-w-25">Description:</span>
                  <span className="text-muted-foreground">{quote.request.description || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-25">Quantity:</span>
                  <span>{quote.request.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-25">Shipping Country:</span>
                  <span>{quote.request.shippingCountry}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* User Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Requested By</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(quote.request.user.fullName, quote.request.user.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{quote.request.user.fullName || 'No name'}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{quote.request.user.email}</span>
                  </div>
                  {quote.request.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{quote.request.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Supplier Information */}
            {quote.supplier && (
              <div>
                <h3 className="text-sm font-medium mb-3">Supplier</h3>
                <div className="space-y-2">
                  <p className="font-medium">{quote.supplier.name}</p>
                  {quote.supplier.contactPerson && (
                    <p className="text-sm">Contact: {quote.supplier.contactPerson}</p>
                  )}
                  {quote.supplier.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{quote.supplier.contactEmail}</span>
                    </div>
                  )}
                  {quote.supplier.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{quote.supplier.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}