// app/[locale]/admin/product-requests/page.tsx
import { Suspense } from 'react';
import { getProductRequests } from './actions';
import { RequestsTable } from './_components/RequestsTable';
import { RequestsTableSkeleton } from './_components/RequestsTableSkeleton';
import { AdminHeader } from '../../_components/AdminHeader';

export default async function ProductRequestsPage() {
  const initialData = await getProductRequests({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6 p-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Product Requests</h1>
        <p className="text-sm text-muted-foreground">
          Total: {initialData.total} requests
        </p>
      </div>

      <Suspense fallback={<RequestsTableSkeleton />}>
        <RequestsTable initialData={initialData} />
      </Suspense>
    </div>
  );
}