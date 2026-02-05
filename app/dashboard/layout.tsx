import React from "react";
import { DashboardSidebar } from "./_components/Sidebar/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

function DashboardLayout({ children }: { children: React.ReactNode }) {
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

export default DashboardLayout;