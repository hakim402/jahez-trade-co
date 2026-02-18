import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { StatCard } from "../../_components/StatCard";
import { RecentRequests } from "../../_components/RecentRequests";
import { RecentBookings } from "../../_components/RecentBookings";
import { RecentUsers } from "../../_components/RecentUsers";
import { OverviewChart } from "../../_components/OverviewChart";
import { QuickActions } from "../../_components/QuickActions";
import {
  Users,
  ShoppingCart,
  Video,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  await requireAdmin();

  // Fetch all statistics in parallel
  const [
    totalUsers,
    totalRequests,
    totalBookings,
    activeSubscriptions,
    pendingRequests,
    todayBookings,
    recentRequests,
    recentBookings,
    recentUsers,
    requestTrends,
    userTrends,
  ] = await Promise.all([
    // Counts
    prisma.user.count(),
    prisma.productRequest.count(),
    prisma.videoBooking.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),

    // Pending requests
    prisma.productRequest.count({ where: { status: "SUBMITTED" } }),

    // Today's bookings
    prisma.videoBooking.count({
      where: {
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
      },
    }),

    // Recent requests (last 5)
    prisma.productRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, email: true } } },
    }),

    // Recent bookings (last 5)
    prisma.videoBooking.findMany({
      take: 5,
      orderBy: { scheduledAt: "desc" },
      include: { user: { select: { fullName: true, email: true } } },
    }),

    // Recent users (last 5)
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),

    // Request trends (last 7 days)
    prisma.$queryRaw`
  SELECT DATE("createdAt") as date, COUNT(*) as count
  FROM "ProductRequest"
  WHERE "createdAt" >= NOW() - INTERVAL '7 days'
  GROUP BY DATE("createdAt")
  ORDER BY date ASC
`,

    // User registration trends (last 7 days)
    prisma.$queryRaw`
  SELECT DATE("createdAt") as date, COUNT(*) as count
  FROM "User"
  WHERE "createdAt" >= NOW() - INTERVAL '7 days'
  GROUP BY DATE("createdAt")
  ORDER BY date ASC
`,
  ]);

  // Format trends for chart
  const requestChartData = (requestTrends as any[]).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    requests: Number(item.count),
  }));

  const userChartData = (userTrends as any[]).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    users: Number(item.count),
  }));


  if (!userId) {
    return <div>Please sign in</div>;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hi, <span className="text-gradient">{user.fullName || "Admin"}</span></h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          description="All registered users"
          className="bg-linear-to-br from-white/10 to-purple-400 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
        <StatCard
          title="Total Requests"
          value={totalRequests}
          icon={ShoppingCart}
          description="Product sourcing requests"
          className="bg-linear-to-br from-white/10 to-purple-400 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookings}
          icon={Video}
          description="Video consultation bookings"
          className="bg-linear-to-br from-white/10 to-purple-400 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptions}
          icon={CreditCard}
          description="Paying subscribers"
          className="bg-linear-to-br from-white/10 to-purple-400 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <OverviewChart
          title="Requests (Last 7 Days)"
          data={requestChartData}
          dataKey="requests"
          color="hsl(var(--chart-1))"
        />
        <OverviewChart
          title="New Users (Last 7 Days)"
          data={userChartData}
          dataKey="users"
          color="hsl(var(--chart-2))"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          description="Awaiting review"
          className="bg-linear-to-br from-white/10 to-blue-300 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
        <StatCard
          title="Today's Bookings"
          value={todayBookings}
          icon={AlertCircle}
          description="Scheduled for today"
          className="bg-linear-to-br from-white/10 to-blue-300 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptions}
          icon={CheckCircle2}
          description="Currently active"
          className="bg-linear-to-br from-white/10 to-blue-300 dark:bg-linear-to-br dark:from-purple-950/30 dark:to-blue-950/30"
        />
      </div>

      {/* Recent Activity Lists */}
      <div className="grid gap-6 md:grid-cols-3">
        <RecentUsers users={recentUsers} />
        <RecentRequests requests={recentRequests} />
        <RecentBookings bookings={recentBookings} />
      </div>
    </div>
  );
}
