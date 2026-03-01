// app/[locale]/admin/files/page.tsx
import { Suspense } from 'react';
import { getFiles } from './actions';
import { FilesTable } from './_components/FilesTable';
import { FilesTableSkeleton } from './_components/FilesTableSkeleton';
import { AdminHeader } from '../../_components/AdminHeader';

export default async function FilesPage() {
  const initialData = await getFiles({
    take: 20,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6 p-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
        <p className="text-sm text-muted-foreground">
          Total: {initialData.total} files
        </p>
      </div>

      <Suspense fallback={<FilesTableSkeleton />}>
        <FilesTable initialData={initialData} />
      </Suspense>
    </div>
  );
}