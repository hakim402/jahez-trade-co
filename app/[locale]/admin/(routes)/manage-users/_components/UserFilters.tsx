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
import { Badge } from '@/components/ui/badge';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { GetUsersParams } from '../actions';

interface UserFiltersProps {
  onSearch: (search: string) => void;
  onRoleFilter: (role: GetUsersParams['role']) => void;
  onStatusFilter: (isActive: boolean | undefined) => void;
  isPending: boolean;
  total: number;
}

export function UserFilters({
  onSearch,
  onRoleFilter,
  onStatusFilter,
  isPending,
  total,
}: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CLIENT' | 'ALL'>('ALL');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    onRoleFilter(role === 'ALL' ? undefined : role);
  }, [role, onRoleFilter]);

  useEffect(() => {
    onStatusFilter(
      status === 'ALL' ? undefined : status === 'ACTIVE' ? true : false
    );
  }, [status, onStatusFilter]);

  const handleClear = () => {
    setSearchInput('');
    setRole('ALL');
    setStatus('ALL');
  };

  const activeFilterCount =
    (searchInput ? 1 : 0) +
    (role !== 'ALL' ? 1 : 0) +
    (status !== 'ALL' ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
          <Input
            placeholder="Search by name, email or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 bg-background"
            disabled={isPending}
          />
        </div>

        <div className="flex gap-2">
          {/* Role filter */}
          <Select
            value={role}
            onValueChange={(v) => setRole(v as typeof role)}
            disabled={isPending}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="CLIENT">Client</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
            disabled={isPending}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={isPending}
              className="shrink-0"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filter chips + result count */}
      {(activeFilterCount > 0 || total > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          {role !== 'ALL' && (
            <Badge variant="secondary" className="text-xs gap-1">
              Role: {role}
              <Button onClick={() => setRole('ALL')} className="ml-1 hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          {status !== 'ALL' && (
            <Badge variant="secondary" className="text-xs gap-1">
              Status: {status}
              <Button onClick={() => setStatus('ALL')} className="ml-1 hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          {searchInput && (
            <Badge variant="secondary" className="text-xs gap-1">
              Search: "{searchInput}"
              <Button onClick={() => setSearchInput('')} className="ml-1 hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {total} user{total !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  );
}