// app/[locale]/admin/_components/AdminLayoutContent.tsx

"use client";

import { motion } from "framer-motion";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <motion.div
        className={cn(
          "min-h-screen transition-all duration-300 bg-background backdrop-blur-sm",
          "lg:ml-0",
          collapsed ? "lg:ml-20" : "lg:ml-64",
          // No margin on mobile
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  );
}

export default function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
