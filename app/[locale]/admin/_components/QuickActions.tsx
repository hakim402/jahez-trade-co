// app/[locale]/admin/_components/QuickActions.tsx

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus, Bell, Users, PackageSearch,
  Video, Calendar, Settings, BarChart3,
} from 'lucide-react';

const quickActions = [
  { icon: PackageSearch, label: 'Product Requests', href: '/admin/product-requests', color: 'from-violet-500 to-purple-500' },
  { icon: Video,         label: 'Video Bookings',   href: '/admin/video-bookings',   color: 'from-blue-500 to-cyan-500' },
  { icon: Calendar,      label: 'Video Slots',      href: '/admin/video-slots',      color: 'from-emerald-500 to-teal-500' },
  { icon: Users,         label: 'Manage Users',     href: '/admin/manage-users',     color: 'from-amber-500 to-orange-500' },
  { icon: Bell,          label: 'Notifications',    href: '/admin/notifications',    color: 'from-pink-500 to-rose-500' },
  { icon: BarChart3,     label: 'Analytics',        href: '/admin/analytics',        color: 'from-indigo-500 to-blue-500' },
  { icon: Plus,          label: 'New Slot',         href: '/admin/video-slots/new',  color: 'from-cyan-500 to-blue-500' },
  { icon: Settings,      label: 'Settings',         href: '/admin/settings',         color: 'from-slate-500 to-slate-400' },
];

export function QuickActions() {
  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground text-lg font-semibold">Quick Actions</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">Navigate to key areas</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 h-auto py-4 px-2 bg-muted/20 hover:bg-accent/20 border border-border/5 hover:border-border/10 rounded-xl transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-linear-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon size={20} className="text-white" />
              </div>
              <span className="text-muted-foreground text-xs font-medium text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}