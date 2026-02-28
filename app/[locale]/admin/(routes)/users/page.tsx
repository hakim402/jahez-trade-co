// app/[locale]/admin/users/page.tsx
import { Suspense } from 'react';
import { getUsers } from './actions'; 
import { UserTable } from './_components/UserTable';
import { UserTableSkeleton } from './_components/UserTableSkeleton';
import { AdminHeader } from '../../_components/AdminHeader';

export default async function UsersPage() {
  // Fetch fresh data every time (no caching for admin)
  const initialData = await getUsers({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6 p-6">
      <AdminHeader />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Total: {initialData.total} users
        </p>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        <UserTable initialData={initialData} />
      </Suspense>
    </div>
  );
}