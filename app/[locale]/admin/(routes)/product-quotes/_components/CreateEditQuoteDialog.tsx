// app/[locale]/admin/product-quotes/_components/CreateEditQuoteDialog.tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createQuote, updateQuote, getQuoteById, type CreateQuoteInput } from '../actions';
import { QuoteStatus } from '@prisma/client';

// --- Real data fetching (replace with your actual server actions) ---
// You need to implement these two server actions:
// - getRequestOptions(): returns array of { id: string; label: string }
// - getSupplierOptions(): returns array of { id: string; name: string }
import { getRequestOptions, getSupplierOptions } from '../actions'; // example import

const formSchema = z.object({
  requestId: z.string().min(1, 'Request is required'),
  supplierId: z.string().optional().nullable(),
  price: z.number().positive('Price must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  status: z.nativeEnum(QuoteStatus),
  adminNotes: z.string().optional(),
  quoteFileUrl: z.string().url().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEditQuoteDialogProps {
  quoteId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  prefillRequestId?: string | null; // <-- new prop
}

export function CreateEditQuoteDialog({
  quoteId,
  open,
  onOpenChange,
  mode,
  onSuccess,
  prefillRequestId, // <-- receive it
}: CreateEditQuoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State for dropdown options
  const [requestOptions, setRequestOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [supplierOptions, setSupplierOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestId: prefillRequestId || '', // prefill if available
      supplierId: null,
      price: 0,
      currency: 'USD',
      status: 'DRAFT',
      adminNotes: '',
      quoteFileUrl: null,
    },
  });

  // Fetch dropdown options when dialog opens (only once)
  useEffect(() => {
    if (open) {
      setOptionsLoading(true);
      Promise.all([
        getRequestOptions().catch(() => []),
        getSupplierOptions().catch(() => []),
      ]).then(([requests, suppliers]) => {
        setRequestOptions(requests);
        setSupplierOptions(suppliers);
        setOptionsLoading(false);
      });
    }
  }, [open]);

  // Fetch quote data when editing
  useEffect(() => {
    if (mode === 'edit' && quoteId && open) {
      setLoading(true);
      getQuoteById({ id: quoteId })
        .then((data) => {
          form.reset({
            requestId: data.quote.request.id,
            supplierId: data.quote.supplier?.id || null,
            price: data.quote.price,
            currency: data.quote.currency,
            status: data.quote.status,
            adminNotes: data.quote.adminNotes || '',
            quoteFileUrl: data.quote.quoteFileUrl,
          });
        })
        .catch((error) => {
          toast.error('Failed to load quote data');
          onOpenChange(false);
        })
        .finally(() => setLoading(false));
    } else if (mode === 'create' && open) {
      // Reset but keep prefillRequestId if provided
      form.reset({
        requestId: prefillRequestId || '',
        supplierId: null,
        price: 0,
        currency: 'USD',
        status: 'DRAFT',
        adminNotes: '',
        quoteFileUrl: null,
      });
    }
  }, [mode, quoteId, open, form, onOpenChange, prefillRequestId]);

  const onSubmit = async (values: FormValues) => {
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createQuote(values as CreateQuoteInput);
          toast.success('Quote created successfully');
        } else {
          if (!quoteId) return;
          await updateQuote({ id: quoteId, ...values });
          toast.success('Quote updated successfully');
        }
        onSuccess?.();
        onOpenChange(false);
      } catch (error) {
        toast.error(`Failed to ${mode} quote`, {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  };

  const isRequestDisabled = mode === 'edit' || (mode === 'create' && !!prefillRequestId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Quote' : 'Edit Quote'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new quote for a product request.'
              : 'Update the quote details.'}
          </DialogDescription>
        </DialogHeader>

        {loading || optionsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="requestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Request</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isRequestDisabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select request" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requestOptions.map((req) => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=" ">None</SelectItem>
                        {supplierOptions.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="USD" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(QuoteStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quoteFileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote File URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}