'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete: () => void;
  bookingDetails: {
    type: string;
    market: string;
    date: string;
    time: string;
  };
}

export function PaymentDialog({ open, onOpenChange, onPaymentComplete, bookingDetails }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border border-border/50">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Complete Payment</DialogTitle>
          <DialogDescription>
            Pay $99 to confirm your video call booking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="bg-muted dark:bg-neutral-800 p-4 rounded-lg border border-border/50">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Video Call Booking</span>
              <span className="font-medium">$99.00</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{bookingDetails.type === 'market' ? 'Market Visit' : 'Factory Visit'}</span>
              <span>{bookingDetails.date} at {bookingDetails.time}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="dark:text-white">Payment Method (Demo)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 border-brand/20 hover:border-brand/50">
                <CreditCard className="h-5 w-5 text-brand" />
                <span className="text-xs">Card</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 border-brand/20 hover:border-brand/50">
                <span className="text-lg font-bold text-brand">Pay</span>
                <span className="text-xs">Pal</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1 border-brand/20 hover:border-brand/50">
                <span className="text-lg font-bold text-brand">Stripe</span>
              </Button>
            </div>
          </div>
          <Button onClick={onPaymentComplete} className="w-full bg-brand hover:bg-brand/90 text-white">
            Pay $99.00
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}