// app/[locale]/dashboard/layout.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ClientLayoutContent from './_components/ClientLayoutContent';

export default async function ClientLayout({
   children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, fullName: true, avatarUrl: true },
  });

  if (!user || user.role !== "CLIENT") redirect("/admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </div>
  );
}