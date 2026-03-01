'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import BookingForm from '../BookingForm';
import { cn } from '@/lib/utils';

interface BookingDialogProps {
  children: React.ReactNode;
}

export function BookingDialog({ children }: BookingDialogProps) {
  const [open, setOpen] = useState(false);

  return (
     <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={cn(
          "w-[95vw] sm:max-w-2xl lg:max-w-7xl",
    "max-h-[95vh] overflow-y-auto",
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50 shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-2",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-2",
          "duration-300",
          // Custom scrollbar styling
          "[&::-webkit-scrollbar]:w-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30",
        )}
      >
        {/* Decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-brand to-transparent" />

        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-3xl font-bold tracking-tight dark:text-white">
            Book a <span className="text-brand">Video Call</span>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Fill in the details below to schedule your live video session with our sourcing experts.
          </DialogDescription>
        </DialogHeader>

        <div className="px-1"> {/* Adds slight spacing from scrollbar */}
          <BookingForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}