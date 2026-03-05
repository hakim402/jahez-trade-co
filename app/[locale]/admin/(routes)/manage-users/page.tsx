// app/[locale]/admin/(routes)/manage-users/page.tsx
import { Suspense } from 'react';
import { getUsers } from './actions';
import { UserTable } from './_components/UserTable';
import { UserTableSkeleton } from './_components/UserTableSkeleton';
import { AdminHeader } from '../../_components/AdminHeader';

export default async function UsersPage() {
  // FIX: getUsers returns ActionResult<GetUsersReturn> — unwrap before passing to UserTable
  const result = await getUsers({
    take: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // If the server action failed (e.g. not admin), render an error state
  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <AdminHeader />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage accounts, subscriptions, and access.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {result.data.total.toLocaleString()}
          </span>{' '}
          total users
        </div>
      </div>

      <Suspense fallback={<UserTableSkeleton />}>
        {/* FIX: pass result.data (GetUsersReturn) not result (ActionResult) */}
        <UserTable initialData={result.data} />
      </Suspense>
    </div>
  );
}