"use client";

import { useTranslations } from "next-intl";
import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageSquare,
  PackageSearch,
  Video,
  BotMessageSquare,
  BriefcaseBusiness,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href?: string; // optional for items without navigation
  badge?: number;
}

export function Sidebar() {
  const t = useTranslations("Sidebar");
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const clerk = useClerk();

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const handleSettingsClick = () => {
    setMobileOpen(false);
    clerk.openUserProfile();
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, labelKey: "dashboard", href: "/dashboard" },
    {
      icon: PackageSearch,
      labelKey: "myRequests",
      href: "/dashboard/requests",
    },
    {
      icon: Video,
      labelKey: "videoBookings",
      href: "/dashboard/bookings",
    },
    {
      icon: BriefcaseBusiness,
      labelKey: "consulting",
      href: "/dashboard/consulting",
    },
    {
      icon: Bell,
      labelKey: "notifications",
      href: "/dashboard/notifications",
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      icon: BotMessageSquare,
      labelKey: "support",
      href: "/dashboard/support",
    },
    { icon: Settings, labelKey: "settings" }, // no href, will trigger modal
  ];

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
          "fixed top-0 z-50 h-screen bg-sidebar/90 border-sidebar-border/5 transition-all duration-300",
          // Desktop positioning – always visible
          "lg:block lg:translate-x-0",
          "ltr:lg:left-0 rtl:lg:right-0",
          "ltr:border-r rtl:border-l",
          collapsed ? "lg:w-22" : "lg:w-64",
          // Base width (mobile uses this)
          "w-64",
          // Mobile transforms – only apply below lg breakpoint
          mobileOpen
            ? "max-lg:translate-x-0"
            : "ltr:max-lg:-translate-x-full rtl:max-lg:translate-x-full",
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
                className="object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-sidebar-foreground font-semibold text-lg">
                Dashboard
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10 cursor-pointer"
          >
            <span className="inline-block rtl:rotate-180">
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </span>
          </Button>
        </div>

        <nav className="flex flex-col justify-between h-[calc(100%-4rem)] py-4 px-3">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.labelKey}
                href={item.href!}
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
                    <span>{t(item.labelKey)}</span>
                    {item.badge && (
                      <span className="ms-auto text-xs bg-sidebar-primary/20 text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>

          <div className="space-y-1 border-t border-sidebar-border/5 pt-4">
            {bottomNavItems.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.labelKey}
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
                        <span>{t(item.labelKey)}</span>
                        {item.badge && (
                          <span className="ms-auto text-xs bg-sidebar-primary/20 text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              }
              // Settings button without href
              return (
                <button
                  key={item.labelKey}
                  onClick={handleSettingsClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left",
                    "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                  )}
                >
                  <item.icon size={20} />
                  {!collapsed && (
                    <>
                      <span>{t(item.labelKey)}</span>
                      {item.badge && (
                        <span className="ms-auto text-xs bg-sidebar-primary/20 text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
