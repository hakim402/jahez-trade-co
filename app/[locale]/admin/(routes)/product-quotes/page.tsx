// app/[locale]/admin/product-quotes/page.tsx
import { Suspense } from 'react';
import { getQuotes } from './actions';
import { QuotesTable } from './_components/QuotesTable';
import { QuotesTableSkeleton } from './_components/QuotesTableSkeleton';
import { AdminHeader } from '../../_components/AdminHeader';

export default async function QuotesPage() {
  const initialData = await getQuotes({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6 p-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
        <p className="text-sm text-muted-foreground">
          Total: {initialData.total} quotes
        </p>
      </div>

      <Suspense fallback={<QuotesTableSkeleton />}>
        <QuotesTable initialData={initialData} />
      </Suspense>
    </div>
  );
}