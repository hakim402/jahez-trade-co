// app/[locale]/admin/product-requests/_components/RequestFilters.tsx
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
import { RequestStatus } from '@prisma/client';

interface RequestFiltersProps {
  onSearch: (search: string) => void;
  onStatusFilter: (status: RequestStatus | undefined) => void;
  isPending: boolean;
}

export function RequestFilters({ onSearch, onStatusFilter, isPending }: RequestFiltersProps) {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<RequestStatus | 'ALL'>('ALL');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    onStatusFilter(status === 'ALL' ? undefined : status);
  }, [status, onStatusFilter]);

  const handleClear = () => {
    setSearchInput('');
    setStatus('ALL');
  };

  const hasFilters = searchInput || status !== 'ALL';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product link, description, user..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as typeof status)}
          disabled={isPending}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="QUOTED">Quoted</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isPending}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}