// app/dashboard/_components/Sidebar/DashboardSidebar.jsx

import {
  Calendar,
  Home,
  Search,
  Settings,
  Users,
  BarChart3,
  Video,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

const navItems = [
  {
    title: "Profile",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "My Requests",
    url: "/dashboard/my-requests",
    icon: Users,
  },
  {
    title: "Video Bookings",
    url: "/dashboard/my-video-bookings",
    icon: Video,
  },
  {
    title: "Subscriptions",
    url: "/dashboard/my-subscriptions",
    icon: CreditCard,
  },
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: CreditCard,
  },
 
];


const secondaryItems = [
  {
    title: "Search",
    url: "/dashboard/search",
    icon: Search,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
 return (
    <Sidebar className="border-r">
      <SidebarContent className="bg-linear-to-br from-white/10  to-purple-400 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="text-lg font-semibold">
            <Image
              src="/logo/skillora.jpg"
              width={120}
              height={80}
              alt="Skillora Logo"
            />
          </Link>
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} className="p-3">
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-purple-700" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title} className="p-3">
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-purple-700" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
