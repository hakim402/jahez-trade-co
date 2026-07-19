"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useSidebar } from "@/context/sidebar-context";
import { useBadgeCounts } from "@/context/admin-badge-counts-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserRound,
  TrendingUp,
  PackageSearch,
  Calculator,
  Truck,
  Video,
  Headset,
  Newspaper,
  MessageCircle,
  ScrollText,
  Bell,
  Blocks,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — navigation structure
// ─────────────────────────────────────────────────────────────────────────────

function buildNavSections(badgeCounts: Record<string, number>): {
  id: string;
  label: string;
  items: NavItem[];
}[] {
  return [
    // ── Overview ────────────────────────────────────────────────────────────
    {
      id: "overview",
      label: "",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      ],
    },

    // ── Users & Staff ───────────────────────────────────────────────────────
    {
      id: "users",
      label: "Users & Staff",
      items: [
        { icon: Users, label: "Manage Users", href: "/admin/manage-users" },
        { icon: UserRound, label: "Manage Employees", href: "/admin/manage-employees" },
      ],
    },

    // ── Products & Commerce ─────────────────────────────────────────────────
    {
      id: "products",
      label: "Products & Commerce",
      items: [
        { icon: TrendingUp, label: "Trending Products", href: "/admin/products" },
        {
          icon: PackageSearch,
          label: "Product Requests",
          href: "/admin/requests",
          badge: badgeCounts.productRequests,
        },
        { icon: Calculator, label: "Shipping Estimations", href: "/admin/shipping-estimations" },
        { icon: Truck, label: "Shipments & Tracking", href: "/admin/shipments" },
      ],
    },

    // ── Services ────────────────────────────────────────────────────────────
    {
      id: "services",
      label: "Services",
      items: [
        {
          icon: Video,
          label: "Video Bookings",
          href: "/admin/bookings",
          badge: badgeCounts.videoBookings,
        },
        {
          icon: Headset,
          label: "Consulting",
          href: "/admin/consulting",
          badge: badgeCounts.consultingRequests,
        },
        { icon: Newspaper, label: "Blogs", href: "/admin/blogs" },
      ],
    },

    // ── Operations ──────────────────────────────────────────────────────────
    {
      id: "operations",
      label: "Operations",
      items: [
        {
          icon: MessageCircle,
          label: "Support",
          href: "/admin/support",
          badge: badgeCounts.support,
        },
        {
          icon: ScrollText,
          label: "Audit Log",
          href: "/admin/audit",
          badge: badgeCounts.audit,
        },
      ],
    },

    // ── System ──────────────────────────────────────────────────────────────
    {
      id: "system",
      label: "System",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          href: "/admin/notifications",
          badge: badgeCounts.notifications,
        },
        { icon: Blocks, label: "Integrations", href: "/admin/integrations" },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const badgeCounts = useBadgeCounts() as Record<string, number>;

  const sections = buildNavSections(badgeCounts);

  // Track which groups are expanded (local state).  Groups with a label are
  // collapsible; groups without a label (like "overview") are always open.
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(["users", "products", "services", "operations", "system"])
  );

  const toggleGroup = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── helpers ──────────────────────────────────────────────────────────────

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const groupHasActive = (g: (typeof sections)[number]) =>
    g.items.some((it) => isActive(it.href));

  const closeMobile = () => setMobileOpen(false);

  // ── render a single nav link ─────────────────────────────────────────────

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href);

    const link = (
      <Link
        href={item.href}
        onClick={closeMobile}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative overflow-hidden group",
          active
            ? "bg-gradient-to-r from-[#7b57fc] to-indigo-600 text-white shadow-md shadow-[#7b57fc]/20"
            : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/10"
        )}
      >
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 relative"
        >
          <item.icon size={18} />
          {/* Badge dot in collapsed mode */}
          {collapsed && item.badge ? (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-sidebar" />
          ) : null}
        </motion.div>

        {/* Label + badge (expanded only) */}
        {!collapsed && (
          <>
            <span className="flex-1 text-[13px] font-medium truncate">
              {item.label}
            </span>
            {item.badge ? (
              <span
                className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center leading-tight",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[#7b57fc]/10 text-[#7b57fc]"
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </>
        )}

        {/* Active indicator bar */}
        {active && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
            layoutId="activeIndicator"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </Link>
    );

    // In collapsed mode, wrap with tooltip showing the label
    if (collapsed) {
      return (
        <Tooltip key={item.label} delayDuration={300}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {item.label}
            {item.badge ? ` (${item.badge})` : ""}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "fixed left-0 top-0 z-50 h-screen flex flex-col",
          "bg-sidebar/95 backdrop-blur-xl",
          "border-r border-white/[0.06]",
          "shadow-2xl shadow-black/20",
          "transition-all duration-300",
          // Width
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
          // Mobile
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 min-w-0"
            onClick={closeMobile}
          >
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#7b57fc]/30 to-indigo-600/20 ring-1 ring-white/10 shrink-0">
              <Image
                src="/logo/icons.png"
                alt="Jahez Trade Co"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sidebar-foreground font-bold text-[15px] tracking-tight truncate"
              >
                Jahez Admin
              </motion.span>
            )}
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5 rounded-lg transition-colors shrink-0"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            NAVIGATION
           ═══════════════════════════════════════════════════════════════════ */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-5">
          {sections.map((group) => {
            const hasLabel = group.label.length > 0;
            const groupActive = groupHasActive(group);
            const isOpen =
              !hasLabel || collapsed
                ? true // always show items when no label or when collapsed
                : expanded.has(group.id);

            return (
              <div key={group.id} className="space-y-1">
                {/* ── Group Header ────────────────────────────────────────── */}
                {hasLabel && !collapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors group",
                      groupActive
                        ? "text-[#7b57fc]/80"
                        : "text-sidebar-foreground/35 hover:text-sidebar-foreground/55"
                    )}
                  >
                    <span className="flex-1 text-left">{group.label}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown size={11} />
                    </motion.span>
                  </button>
                )}

                {/* ── Collapsed divider ───────────────────────────────────── */}
                {hasLabel && collapsed && (
                  <div className="flex items-center justify-center py-1.5">
                    <div className="w-5 h-px bg-white/[0.08]" />
                  </div>
                )}

                {/* ── Group Items ─────────────────────────────────────────── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={hasLabel && !collapsed ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => (
                        <motion.div
                          key={item.label}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <NavLink item={item} />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER — Settings + Admin Profile
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-1.5">
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  openUserProfile();
                  closeMobile();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/5"
                )}
              >
                <Settings size={18} className="shrink-0" />
                {!collapsed && (
                  <span className="text-[13px] font-medium">Settings</span>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs font-medium">
                Settings
              </TooltipContent>
            )}
          </Tooltip>

          {/* Admin profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg",
                  collapsed && "justify-center"
                )}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b57fc] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/10">
                  {user?.firstName?.charAt(0)?.toUpperCase() ?? "A"}
                </div>

                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                      {user?.fullName ?? user?.firstName ?? "Administrator"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield size={10} className="text-[#7b57fc] shrink-0" />
                      <p className="text-[10px] text-sidebar-foreground/40 truncate">
                        Admin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="text-xs font-medium">
                {user?.fullName ?? user?.firstName ?? "Administrator"}
                <span className="block text-[10px] text-muted-foreground">
                  Admin
                </span>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────

const sidebarVariants: Variants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
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
