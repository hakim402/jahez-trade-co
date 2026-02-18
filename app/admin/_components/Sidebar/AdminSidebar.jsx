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
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/admin/clients",
    icon: BarChart3,
  },
  {
    title: "Client Requests",
    url: "/admin/client-requests",
    icon: Users,
  },
  {
    title: "Video Bookings",
    url: "/admin/video-bookings",
    icon: Video,
  },
  {
    title: "Availability Calendar",
    url: "/admin/video-bookings/slots",
    icon: Calendar,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "plans",
    url: "/admin/plans",
    icon: CreditCard,
  },
  {
    title: "َAudit Logs",
    url: "/admin/audit",
    icon: BarChart3,
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

export function AdminSidebar() {
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
