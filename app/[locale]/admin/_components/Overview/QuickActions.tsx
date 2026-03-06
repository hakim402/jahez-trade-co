"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Bell,
  Users,
  PackageSearch,
  Video,
  Settings,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { containerVariants, cardVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    icon: PackageSearch,
    label: "Product Requests",
    href: "/admin/product-requests",
    color: "from-[#7b57fc] to-indigo-600",
  }, // brand gradient
  {
    icon: Video,
    label: "Video Bookings",
    href: "/admin/video-bookings",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    label: "Manage Users",
    href: "/admin/manage-users",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Bell,
    label: "Notifications",
    href: "/admin/notifications",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageCircle,
    label: "New Messages",
    href: "/admin/messages/",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/admin/settings",
    color: "from-slate-500 to-slate-400",
  },
];

export function QuickActions() {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="bg-card/50 border-border/5 overflow-hidden transition-all duration-200 hover:shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-card-foreground text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#7b57fc]" />
            Quick Actions
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Navigate to key areas
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-6 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {quickActions.map((action) => (
              <motion.div
                key={action.label}
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={action.href}
                  className="flex flex-col items-center justify-center gap-2 h-auto py-4 px-2 bg-muted/20 hover:bg-accent/20 border border-border/5 hover:border-border/10 rounded-xl transition-all group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg bg-linear-to-br flex items-center justify-center group-hover:scale-110 transition-transform",
                      action.color,
                    )}
                  >
                    <action.icon size={20} className="text-white" />
                  </div>
                  <span className="text-muted-foreground text-xs font-medium text-center">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
