// app/[locale]/admin/product-quotes/_components/QuoteFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { QuoteStatus } from '@prisma/client';

// Placeholder – replace with actual data fetching
const REQUEST_OPTIONS = [
  { id: 'req1', label: 'Request #abc123' },
  { id: 'req2', label: 'Request #def456' },
];

const SUPPLIER_OPTIONS = [
  { id: 'sup1', name: 'Supplier A' },
  { id: 'sup2', name: 'Supplier B' },
];

interface QuoteFiltersProps {
  onSearch: (search: string) => void;
  onStatusFilter: (status: QuoteStatus | undefined) => void;
  onRequestFilter: (requestId: string | undefined) => void;
  onSupplierFilter: (supplierId: string | undefined) => void;
  isPending: boolean;
}

export function QuoteFilters({
  onSearch,
  onStatusFilter,
  onRequestFilter,
  onSupplierFilter,
  isPending,
}: QuoteFiltersProps) {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<QuoteStatus | 'ALL'>('ALL');
  const [requestId, setRequestId] = useState<string | 'ALL'>('ALL');
  const [supplierId, setSupplierId] = useState<string | 'ALL'>('ALL');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    onStatusFilter(status === 'ALL' ? undefined : status);
  }, [status, onStatusFilter]);

  useEffect(() => {
    onRequestFilter(requestId === 'ALL' ? undefined : requestId);
  }, [requestId, onRequestFilter]);

  useEffect(() => {
    onSupplierFilter(supplierId === 'ALL' ? undefined : supplierId);
  }, [supplierId, onSupplierFilter]);

  const handleClear = () => {
    setSearchInput('');
    setStatus('ALL');
    setRequestId('ALL');
    setSupplierId('ALL');
  };

  const hasFilters = searchInput || status !== 'ALL' || requestId !== 'ALL' || supplierId !== 'ALL';

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by notes, product link, supplier..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
          disabled={isPending}
        />
      </div>

      <Select value={status} onValueChange={(value) => setStatus(value as typeof status)} disabled={isPending}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="SENT">Sent</SelectItem>
          <SelectItem value="ACCEPTED">Accepted</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="EXPIRED">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Select value={requestId} onValueChange={(value) => setRequestId(value)} disabled={isPending}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Request" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All requests</SelectItem>
          {REQUEST_OPTIONS.map((req) => (
            <SelectItem key={req.id} value={req.id}>
              {req.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={supplierId} onValueChange={(value) => setSupplierId(value)} disabled={isPending}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Supplier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All suppliers</SelectItem>
          {SUPPLIER_OPTIONS.map((sup) => (
            <SelectItem key={sup.id} value={sup.id}>
              {sup.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={handleClear} disabled={isPending} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}