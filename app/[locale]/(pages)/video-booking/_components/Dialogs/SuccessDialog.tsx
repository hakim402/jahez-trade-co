'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

const MARKETS: Record<string, string> = {
  yiwu: 'Yiwu Market',
  guangzhou: 'Guangzhou',
  shenzhen: 'Shenzhen',
};

const PLATFORMS: Record<string, string> = {
  zoom: 'Zoom',
  'google-meet': 'Google Meet',
  whatsapp: 'WhatsApp',
};

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  bookingDetails: {
    type: string;
    market: string;
    date: string;
    time: string;
    platform: string;
  };
}

export function SuccessDialog({ open, onOpenChange, onClose, bookingDetails }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border border-border/50">
        <DialogHeader className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full orb-brand opacity-20" />
            <div className="relative w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-xl dark:text-white">Booking Confirmed!</DialogTitle>
          <DialogDescription>
            Your video call has been scheduled. Check your email for details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="bg-muted dark:bg-neutral-800 p-4 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Booking Details:</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium dark:text-white">Type:</span>{' '}
                {bookingDetails.type === 'market' ? 'Market Visit' : 'Factory Visit'}
              </p>
              {bookingDetails.type === 'market' && (
                <p>
                  <span className="font-medium dark:text-white">Market:</span>{' '}
                  {MARKETS[bookingDetails.market]}
                </p>
              )}
              <p>
                <span className="font-medium dark:text-white">Date:</span> {bookingDetails.date}
              </p>
              <p>
                <span className="font-medium dark:text-white">Time:</span> {bookingDetails.time} (China Time)
              </p>
              <p>
                <span className="font-medium dark:text-white">Platform:</span>{' '}
                {PLATFORMS[bookingDetails.platform]}
              </p>
            </div>
          </div>
          <Button onClick={onClose} className="w-full bg-brand hover:bg-brand/90 text-white">
            Go to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}