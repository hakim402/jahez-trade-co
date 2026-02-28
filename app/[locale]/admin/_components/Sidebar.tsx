"use client";

import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Wallet,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageSquare,
  FileText,
  Calendar,
  PackageSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Customers", href: "/admin/users" },
  { icon: PackageSearch, label: "Requests", href: "/admin/requests" },
  { icon: Wallet, label: "Revenue", href: "/admin/revenue" },
  { icon: Calendar, label: "Calendar", href: "/admin/calendar" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages", badge: 3 },
];

const bottomNavItems: NavItem[] = [
  { icon: Bell, label: "Notifications", href: "/admin/notifications", badge: 5 },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
  { icon: HelpCircle, label: "Help", href: "/admin/help" },
];

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  // Helper to check if a link is active
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left- top-0 z-50 h-screen bg-sidebar/90 border-r border-sidebar-border/5 transition-all duration-300",
          "lg:translate-x-0",
          collapsed ? "lg:w-18" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-64",
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border/5">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/logo/icon.png"
                alt="mewan logo"
                width={60}
                height={60}
                className="object-contain "
              />
            </div>
            {!collapsed && (
              <span className="text-sidebar-foreground font-semibold text-lg">
                Dashboard
              </span>
            )}
          </Link>

          {/* Toggle button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10 cursor-pointer"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <nav className="flex flex-col justify-between h-[calc(100%-4rem)] py-4 px-3">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive(item.href)
                    ? "bg-linear-to-br from-indigo-500 to-purple-400 text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                )}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-sidebar-primary/20 text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>

          <div className="space-y-1 border-t border-sidebar-border/5 pt-4">
            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive(item.href)
                    ? "bg-linear-to-br from-indigo-500 to-purple-400 text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                )}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-sidebar-primary/20 text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}