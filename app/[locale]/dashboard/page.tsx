// app/[locale]/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserProfile } from './actions';
import UserDashboardHeader from './_components/UserDashboardHeader/UserDashboardHeader';
import DashboardStats from './_components/Overview/DashboardStats';
import RecentActivity from './_components/Overview/RecentActivity';
import ProfileCard from './_components/Overview/ProfileCard';
import SubscriptionCard from './_components/Overview/SubscriptionCard';


export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect('/sign-in');

  const profile = await getUserProfile();

  return (
    <div className="space-y-8">
      <UserDashboardHeader />

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="text-brand">{profile.fullName || 'there'}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your sourcing requests.
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats stats={profile._count} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity userId={profile.id} />
        </div>
        <div className="space-y-6">
          <ProfileCard profile={profile} />
          {profile.subscription && <SubscriptionCard subscription={profile.subscription} />}
        </div>
      </div>
    </div>
  );
}