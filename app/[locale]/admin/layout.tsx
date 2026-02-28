import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminLayoutContent from './_components/AdminLayoutContent';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </div>
  );
}