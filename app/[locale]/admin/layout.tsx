// app/[locale]/admin/layout.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminBadgeCounts } from "./actions/badge-counts-actions"; // ← import
import { BadgeCountsProvider } from "@/context/admin-badge-counts-context";
import AdminLayoutContent from "./_components/AdminLayoutContent";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch user + badge counts in parallel
  const [user, badgeCounts] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    }),
    getAdminBadgeCounts(),
  ]);

  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BadgeCountsProvider counts={badgeCounts}>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </BadgeCountsProvider>
    </div>
  );
}
