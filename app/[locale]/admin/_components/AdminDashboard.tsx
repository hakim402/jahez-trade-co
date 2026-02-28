// app/admin/_components/Hero/AdminHero.tsx

import { AdminHeader } from "./AdminHeader";
import { StatsCard } from "./StatsCard";
import { ActivityChart } from "./ActivityChart";
import { RecentActivity } from "./RecentActivity";
import { QuickActions } from "./QuickActions";
import { ProgressCard } from "./ProgressCard";
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';

const statsData = [
  {
    title: "Total Revenue",
    value: "$48,294",
    change: 12.5,
    changeLabel: "vs last month",
    icon: DollarSign,
    gradient: "purple-blue" as const,
  },
  {
    title: "Active Users",
    value: "2,847",
    change: 8.2,
    changeLabel: "vs last month",
    icon: Users,
    gradient: "blue-cyan" as const,
  },
  {
    title: "Total Orders",
    value: "1,429",
    change: -3.1,
    changeLabel: "vs last month",
    icon: ShoppingCart,
    gradient: "purple-pink" as const,
  },
  {
    title: "Growth Rate",
    value: "24.8%",
    change: 4.3,
    changeLabel: "vs last month",
    icon: TrendingUp,
    gradient: "emerald-teal" as const,
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen">
      <AdminHeader />

      <div className="px-6 py-8 space-y-8 max-w-400 mx-auto">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your business.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            Last updated: <span className="text-color">Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {statsData.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Middle Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ActivityChart />
          </div>

          <ProgressCard />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentActivity />
          </div>

          <QuickActions />
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-4">
          <span>© 2024 Dashboard. All rights reserved.</span>

          <div className="flex gap-6">
            <a className="hover:text-color transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-color transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-color transition-colors" href="#">
              Support
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}