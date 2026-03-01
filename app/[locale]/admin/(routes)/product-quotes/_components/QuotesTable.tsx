// app/[locale]/admin/product-quotes/_components/QuotesTable.tsx
'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, CheckCircle } from 'lucide-react';
import { QuoteFilters } from './QuoteFilters';
import { QuotePagination } from './QuotePagination';
import { QuoteDetailsDialog } from './QuoteDetailsDialog';
import { CreateEditQuoteDialog } from './CreateEditQuoteDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { getQuotes, deleteQuote, acceptQuote, type GetQuotesParams, type GetQuotesReturn } from '../actions';

const statusColorMap: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  SENT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ACCEPTED: 'bg-green-500/10 text-green-600 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  EXPIRED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
};

interface QuotesTableProps {
  initialData: GetQuotesReturn;
}

export function QuotesTable({ initialData }: QuotesTableProps) {
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState<GetQuotesParams>({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isPending, startTransition] = useTransition();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [quoteToAccept, setQuoteToAccept] = useState<string | null>(null);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let isMounted = true;
    startTransition(async () => {
      try {
        const result = await getQuotes(params);
        if (isMounted) setData(result);
      } catch (error) {
        if (isMounted) {
          toast.error('Failed to fetch quotes', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });
    return () => { isMounted = false; };
  }, [params]);

  const handleSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, cursor: undefined }));
  }, []);

  const handleStatusFilter = useCallback((status: GetQuotesParams['status']) => {
    setParams(prev => ({ ...prev, status, cursor: undefined }));
  }, []);

  const handleRequestFilter = useCallback((requestId: string | undefined) => {
    setParams(prev => ({ ...prev, requestId, cursor: undefined }));
  }, []);

  const handleSupplierFilter = useCallback((supplierId: string | undefined) => {
    setParams(prev => ({ ...prev, supplierId, cursor: undefined }));
  }, []);

  const handleSort = useCallback((sortBy: GetQuotesParams['sortBy']) => {
    setParams(prev => {
      const sortOrder = prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return { ...prev, sortBy, sortOrder, cursor: undefined };
    });
  }, []);

  const handleNextPage = useCallback(() => {
    if (data.nextCursor) {
      setParams(prev => ({ ...prev, cursor: data.nextCursor ?? undefined}));
    }
  }, [data.nextCursor]);

  const handlePreviousPage = useCallback(() => {
    setParams(prev => ({ ...prev, cursor: undefined }));
  }, []);

  const handleViewDetails = useCallback((quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setIsDetailsOpen(true);
  }, []);

  const handleEdit = useCallback((quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback((quoteId: string) => {
    setQuoteToDelete(quoteId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleAccept = useCallback((quoteId: string) => {
    setQuoteToAccept(quoteId);
    setAcceptConfirmOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!quoteToDelete) return;
    startTransition(async () => {
      try {
        await deleteQuote({ quoteId: quoteToDelete });
        toast.success('Quote deleted successfully');
        // Refresh data
        const result = await getQuotes(params);
        setData(result);
      } catch (error) {
        toast.error('Failed to delete quote', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setDeleteConfirmOpen(false);
        setQuoteToDelete(null);
      }
    });
  };

  const confirmAccept = async () => {
    if (!quoteToAccept) return;
    startTransition(async () => {
      try {
        await acceptQuote({ quoteId: quoteToAccept });
        toast.success('Quote accepted and request updated');
        // Refresh data
        const result = await getQuotes(params);
        setData(result);
      } catch (error) {
        toast.error('Failed to accept quote', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setAcceptConfirmOpen(false);
        setQuoteToAccept(null);
      }
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <QuoteFilters
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onRequestFilter={handleRequestFilter}
          onSupplierFilter={handleSupplierFilter}
          isPending={isPending}
        />
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          Add Quote
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleSort('price')}>
                  Price
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleSort('status')}>
                  Status
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleSort('createdAt')}>
                  Created
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No quotes found.
                </TableCell>
              </TableRow>
            ) : (
              data.quotes.map((quote) => (
                <TableRow key={quote.id} className="group">
                  <TableCell className="font-mono text-xs">{quote.id.slice(0, 8)}...</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {quote.request.productLink || quote.request.description || '—'}
                  </TableCell>
                  <TableCell>{quote.supplier?.name || '—'}</TableCell>
                  <TableCell className="font-medium">{formatPrice(quote.price, quote.currency)}</TableCell>
                  <TableCell>{quote.currency}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColorMap[quote.status]}>
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{quote.request.user.fullName || quote.request.user.email}</TableCell>
                  <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(quote.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(quote.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {quote.status !== 'ACCEPTED' && (
                          <DropdownMenuItem onClick={() => handleAccept(quote.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </DropdownMenuItem>
                        )}
                        {quote.status !== 'ACCEPTED' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(quote.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QuotePagination
        hasNextPage={!!data.nextCursor}
        hasPreviousPage={!!params.cursor}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
        isPending={isPending}
        total={data.total}
        currentPage={params.cursor ? 'custom' : 1}
      />

      <QuoteDetailsDialog
        quoteId={selectedQuoteId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <CreateEditQuoteDialog
        quoteId={selectedQuoteId}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        mode="edit"
        onSuccess={() => {
          // Refresh data
          getQuotes(params).then(setData);
        }}
      />

      <CreateEditQuoteDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        onSuccess={() => {
          getQuotes(params).then(setData);
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Quote"
        description="Are you sure you want to delete this quote? This action cannot be undone."
        onConfirm={confirmDelete}
        loading={isPending}
      />

      <ConfirmDialog
        open={acceptConfirmOpen}
        onOpenChange={setAcceptConfirmOpen}
        title="Accept Quote"
        description="Accepting this quote will update the associated request status to APPROVED and set this quote as accepted. Continue?"
        onConfirm={confirmAccept}
        loading={isPending}
      />
    </div>
  );
}