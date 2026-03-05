// app/[locale]/admin/_components/AdminDashboard.tsx

import { AdminHeader } from './AdminHeader';
import { StatsGrid } from './StatsGrid';
import { ActivityChart } from './ActivityChart';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { ProgressCard } from './ProgressCard';
import { PendingWorkloadBanner } from './PendingWorkloadBanner';
import {
  getDashboardStats,
  getPendingWorkload,
  getRecentActivity,
  getRevenueBreakdown,
} from '../actions';

export default async function AdminDashboard() {
  // Fetch all data in parallel
  const [statsResult, workloadResult, activityResult, revenueResult] =
    await Promise.all([
      getDashboardStats(),
      getPendingWorkload(),
      getRecentActivity(5),
      getRevenueBreakdown(7),
    ]);

  const stats    = statsResult.success    ? statsResult.data    : null;
  const workload = workloadResult.success ? workloadResult.data : null;
  const activity = activityResult.success ? activityResult.data : [];
  const revenue  = revenueResult.success  ? revenueResult.data  : [];

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
              Welcome back! Here&apos;s what&apos;s happening with your business.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated:{' '}
            <span className="text-color">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Pending workload action banner */}
        {workload && <PendingWorkloadBanner workload={workload} />}

        {/* Stats Grid — real data */}
        <StatsGrid stats={stats} />

        {/* Middle Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {/* ActivityChart needs client interactivity; pass revenue series as prop */}
            <ActivityChart revenueData={revenue} />
          </div>
          <ProgressCard stats={stats} />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentActivity logs={activity} />
          </div>
          <QuickActions />
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-4">
          <span>© {new Date().getFullYear()} Mewan Sourcing. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="hover:text-color transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-color transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-color transition-colors" href="#">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}