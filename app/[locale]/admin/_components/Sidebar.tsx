"use client";

import { motion, Variants } from "framer-motion";
import { useClerk } from "@clerk/nextjs";
import { useSidebar } from "@/context/sidebar-context";
import { useBadgeCounts } from "@/context/admin-badge-counts-context"; // <-- import
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  PackageSearch,
  Video,
  Activity,
  BotMessageSquare,
  TrendingUp,
  BriefcaseBusiness,
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

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const clerk = useClerk();
  const badgeCounts = useBadgeCounts(); // <-- get counts

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Manage Users", href: "/admin/manage-users" },
    {
      icon: TrendingUp,
      label: "Trending Products",
      href: "/admin/products",
    },
    {
      icon: PackageSearch,
      label: "Product Requests",
      href: "/admin/requests",
      badge: badgeCounts.productRequests,
    },
    {
      icon: Video,
      label: "Video Request",
      href: "/admin/bookings",
      badge: badgeCounts.videoBookings,
    },
    {
      icon: BriefcaseBusiness,
      label: "Consulations",
      href: "/admin/consulting",
    },
    {
      icon: BotMessageSquare,
      label: "Support",
      href: "/admin/support",
      badge: badgeCounts.support,
    },
    {
      icon: Activity,
      label: "Audit Log",
      href: "/admin/audit",
      badge: badgeCounts.audit,
    },
  ];

  const bottomNavItems: NavItem[] = [
    {
      icon: Bell,
      label: "Notifications",
      href: "/admin/notifications",
      badge: badgeCounts.notifications,
    },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleSettingsClick = () => {
    clerk.openUserProfile();
    setMobileOpen(false);
  };

  // Animation variants (unchanged) ...

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <motion.div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar/90 backdrop-blur-sm border-r border-sidebar-border/5 shadow-xl transition-all duration-300",
          "lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-64",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border/5">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={handleLinkClick}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/logo/icon.png"
                alt="mewan logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sidebar-foreground font-semibold text-lg"
              >
                Dashboard
              </motion.span>
            )}
          </Link>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10 cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col justify-between h-[calc(100%-4rem)] py-4 px-3">
          <motion.div
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {mainNavItems.map((item) => (
              <motion.div key={item.label} variants={itemVariants}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden group",
                    isActive(item.href)
                      ? "bg-linear-to-r from-[#7b57fc] to-indigo-600 text-white shadow-md"
                      : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0"
                  >
                    <item.icon size={20} />
                  </motion.div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full font-medium",
                            isActive(item.href)
                              ? "bg-white/20 text-white"
                              : "bg-[#7b57fc]/10 text-[#7b57fc]",
                          )}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                  {isActive(item.href) && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                      layoutId="activeIndicator"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="space-y-1 border-t border-sidebar-border/5 pt-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {bottomNavItems.map((item) => (
              <motion.div key={item.label} variants={itemVariants}>
                {item.label === "Settings" ? (
                  <button
                    onClick={handleSettingsClick}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden group",
                      isActive(item.href)
                        ? "bg-linear-to-r from-[#7b57fc] to-indigo-600 text-white shadow-md"
                        : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0"
                    >
                      <item.icon size={20} />
                    </motion.div>
                    {!collapsed && (
                      <span className="flex-1 text-sm font-medium text-left">
                        {item.label}
                      </span>
                    )}
                    {isActive(item.href) && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                        layoutId="activeIndicator"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden group",
                      isActive(item.href)
                        ? "bg-linear-to-r from-[#7b57fc] to-indigo-600 text-white shadow-md"
                        : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10",
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0"
                    >
                      <item.icon size={20} />
                    </motion.div>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full font-medium",
                              isActive(item.href)
                                ? "bg-white/20 text-white"
                                : "bg-[#7b57fc]/10 text-[#7b57fc]",
                            )}
                          >
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                    {isActive(item.href) && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                        layoutId="activeIndicator"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </nav>
      </motion.aside>
    </>
  );
}

// Add the variants at the bottom (they were omitted for brevity, keep yours)
const sidebarVariants: Variants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};
