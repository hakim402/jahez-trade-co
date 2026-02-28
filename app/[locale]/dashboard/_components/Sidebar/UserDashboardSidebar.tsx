// app/[locale]/dashboard/_components/Sidebar/DashboardSidebar.tsx
"use client";

import {
  Home,
  Search,
  Users,
  Video,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { SettingsButton } from "./SettingsButton";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "My Requests", url: "/dashboard/requests", icon: Users },
  { title: "Video Bookings", url: "/dashboard/video-bookings", icon: Video },
  { title: "Subscriptions", url: "/dashboard/subscriptions", icon: CreditCard },
  { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
];

export function UserDashboardSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-border/50 bg-background/80 backdrop-blur-xl">
      <SidebarHeader className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold text-foreground">Mewan</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-brand/10 text-brand shadow-sm"
                        : "hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        isActive ? "bg-brand text-white" : "bg-muted",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="mt-8 pt-8 border-t border-border/50">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href="/dashboard/search"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/50 transition-all duration-200"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Search className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Search</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SettingsButton />
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">
              john@example.com
            </p>
          </div>
          <SignOutButton>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
