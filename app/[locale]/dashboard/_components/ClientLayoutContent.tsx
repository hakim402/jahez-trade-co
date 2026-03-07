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
          // Use margin-inline-start for RTL compatibility
          'lg:ms-0',
          collapsed ? 'lg:ms-20' : 'lg:ms-64'
        )}
      >
        {children}
      </div>
    </>
  );
}

export default function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}