// app/[locale]/admin/_components/StatsGrid.tsx

import { StatsCard } from './StatsCard';
import DollarSign  from 'lucide-react/dist/esm/icons/dollar-sign';
import Users       from 'lucide-react/dist/esm/icons/users';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Video       from 'lucide-react/dist/esm/icons/video';
import FileText    from 'lucide-react/dist/esm/icons/file-text';
import Bell        from 'lucide-react/dist/esm/icons/bell';
import type { DashboardStats } from '../actions';

interface Props {
  stats: DashboardStats | null;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export function StatsGrid({ stats }: Props) {
  const cards = [
    {
      title: 'Total Revenue',
      value: stats ? fmt(stats.payments.totalRevenue) : '—',
      sub: `+${fmt(stats?.payments.revenueToday ?? 0)} today`,
      icon: DollarSign,
      gradient: 'purple-blue' as const,
      // week-over-week delta — rough proxy
      change: stats
        ? stats.payments.revenueThisWeek > 0
          ? +((stats.payments.revenueToday / (stats.payments.revenueThisWeek / 7)) * 100 - 100).toFixed(1)
          : 0
        : 0,
    },
    {
      title: 'Active Users',
      value: stats ? stats.users.active.toLocaleString() : '—',
      sub: `+${stats?.users.newToday ?? 0} today · +${stats?.users.newThisWeek ?? 0} this week`,
      icon: Users,
      gradient: 'blue-cyan' as const,
      change: stats && stats.users.total > 0
        ? +((stats.users.newThisWeek / stats.users.total) * 100).toFixed(1)
        : 0,
    },
    {
      title: 'Product Requests',
      value: stats ? stats.requests.total.toLocaleString() : '—',
      sub: `+${stats?.requests.newToday ?? 0} today`,
      icon: ShoppingCart,
      gradient: 'purple-pink' as const,
      change: stats && stats.requests.total > 0
        ? +((stats.requests.newToday / stats.requests.total) * 100).toFixed(1)
        : 0,
    },
    {
      title: 'Video Bookings',
      value: stats ? stats.bookings.total.toLocaleString() : '—',
      sub: `${stats?.bookings.upcoming.length ?? 0} upcoming`,
      icon: Video,
      gradient: 'emerald-teal' as const,
      change: stats
        ? stats.bookings.byStatus['CONFIRMED'] ?? 0
        : 0,
    },
    {
      title: 'Quotes',
      value: stats ? stats.quotes.total.toLocaleString() : '—',
      sub: `${fmt(stats?.quotes.totalValue ?? 0)} accepted value`,
      icon: FileText,
      gradient: 'amber-orange' as const,
      change: stats && stats.quotes.total > 0
        ? +((( stats.quotes.byStatus['ACCEPTED'] ?? 0) / stats.quotes.total) * 100).toFixed(1)
        : 0,
    },
    {
      title: 'Notifications',
      value: stats ? stats.notifications.total.toLocaleString() : '—',
      sub: `${stats?.notifications.unread ?? 0} unread · ${stats?.notifications.sentToday ?? 0} today`,
      icon: Bell,
      gradient: 'purple-blue' as const,
      change: stats && stats.notifications.total > 0
        ? -(+((stats.notifications.unread / stats.notifications.total) * 100).toFixed(1))
        : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6">
      {cards.map((card) => (
        <StatsCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={card.change}
          changeLabel={card.sub}
          icon={card.icon}
          gradient={card.gradient}
        />
      ))}
    </div>
  );
}