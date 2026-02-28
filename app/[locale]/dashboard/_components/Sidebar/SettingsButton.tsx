// app/[locale]/dashboard/_components/UserDashboardSidebar/SettingsButton.tsx

"use client";

import { Settings } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SettingsButton() {
  const { openUserProfile } = useClerk();

  return (
    <SidebarMenuItem className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all duration-200">
      <SidebarMenuButton
        onClick={() => openUserProfile()}
        className="flex items-center gap-3"
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}