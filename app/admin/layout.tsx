import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./_components/Sidebar/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, fullName: true, avatarUrl: true },
  });

  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1">
          <main className="p-2 md:p-2 lg:p-4 max-w-7xl mx-auto width">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
