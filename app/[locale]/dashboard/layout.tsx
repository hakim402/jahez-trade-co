// app/[locale]/dashboard/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarProvider } from "@/components/ui/sidebar";
import {  UserDashboardSidebar } from "./_components/Sidebar/UserDashboardSidebar";

export default async function AdminLayout({
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
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-white dark:bg-neutral-950 overflow-hidden">
        {/* Background pattern and orbs (optional) */}
        <div className="absolute inset-0 bg-brand-pattern opacity-5 pointer-events-none" />
        <div className="absolute top-20 left-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full orb-brand mix-blend-multiply pointer-events-none" />

        <UserDashboardSidebar />
        <div className="flex-1 relative z-10">
          <main className="p-2 md:p-2 lg:p-4 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}