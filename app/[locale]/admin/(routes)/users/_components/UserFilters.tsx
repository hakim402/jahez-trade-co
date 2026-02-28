// app/[locale]/admin/users/_components/UserFilters.tsx
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

interface UserFiltersProps {
  onSearch: (search: string) => void;
  onRoleFilter: (role: 'ADMIN' | 'CLIENT' | undefined) => void;
  isPending: boolean;
}

export function UserFilters({ onSearch, onRoleFilter, isPending }: UserFiltersProps) {
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CLIENT' | 'ALL'>('ALL');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  useEffect(() => {
    onRoleFilter(role === 'ALL' ? undefined : role);
  }, [role, onRoleFilter]);

  const handleClear = () => {
    setSearchInput('');
    setRole('ALL');
  };

  const hasFilters = searchInput || role !== 'ALL';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-8"
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={role}
          onValueChange={(value) => setRole(value as typeof role)}
          disabled={isPending}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
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