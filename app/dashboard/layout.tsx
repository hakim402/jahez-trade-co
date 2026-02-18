import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "../dashboard/_components/Sidebar/DashboardSidebar";

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
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex-1">
          <main className="p-2 md:p-2 lg:p-4 max-w-7xl mx-auto width">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
