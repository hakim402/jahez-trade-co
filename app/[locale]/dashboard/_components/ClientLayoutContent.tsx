'use client';

import { SidebarProvider, useSidebar } from '@/context/sidebar-context';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-300 bg-background backdrop-blur-sm',
          'lg:ml-0',
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
          // No margin on mobile
        )}
      >
        {children}
      </div>
    </>
  );
}

export default function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}