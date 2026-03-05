// app/[locale]/admin/_components/ProgressCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Award, MessageSquare } from 'lucide-react';
import type { DashboardStats } from '../actions';

interface Props {
  stats: DashboardStats | null;
}

export function ProgressCard({ stats }: Props) {
  // Build goals dynamically from real data
  const goals = [
    {
      id: 'revenue',
      title: 'Monthly Revenue Goal',
      // target = this week's revenue × 4 (rough monthly projection), floor at $1
      current: stats?.payments.revenueThisWeek ?? 0,
      target: Math.max((stats?.payments.revenueThisWeek ?? 0) * 4, 1),
      display: {
        current: `$${((stats?.payments.revenueThisWeek ?? 0) / 1000).toFixed(1)}k`,
        target:  `$${(Math.max((stats?.payments.revenueThisWeek ?? 0) * 4, 1) / 1000).toFixed(0)}k`,
      },
      icon: Target,
      color: 'from-violet-500 to-blue-500',
    },
    {
      id: 'users',
      title: 'New Users This Week',
      current: stats?.users.newThisWeek ?? 0,
      target:  Math.max(stats?.users.newThisWeek ?? 0, 50), // goal = at least 50
      display: {
        current: String(stats?.users.newThisWeek ?? 0),
        target:  String(Math.max(stats?.users.newThisWeek ?? 0, 50)),
      },
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'requests',
      title: 'Requests Completed',
      current: stats?.requests.byStatus['COMPLETED'] ?? 0,
      target:  Math.max(stats?.requests.total ?? 0, 1),
      display: {
        current: String(stats?.requests.byStatus['COMPLETED'] ?? 0),
        target:  String(stats?.requests.total ?? 0),
      },
      icon: Award,
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'chats',
      title: 'Chat Engagement',
      current: stats?.chats.totalMessages ?? 0,
      target:  Math.max(stats?.chats.totalMessages ?? 0, 100),
      display: {
        current: String(stats?.chats.totalMessages ?? 0),
        target:  String(Math.max(stats?.chats.totalMessages ?? 0, 100)),
      },
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground text-lg font-semibold">
          Goals Progress
        </CardTitle>
        <p className="text-muted-foreground text-sm mt-1">Live business metrics</p>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-5">
          {goals.map((goal) => {
            const percentage = goal.target > 0
              ? Math.min(Math.round((goal.current / goal.target) * 100), 100)
              : 0;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${goal.color} flex items-center justify-center`}>
                      <goal.icon size={16} className="text-white" />
                    </div>
                    <span className="text-card-foreground text-sm font-medium">
                      {goal.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-card-foreground text-sm font-semibold">
                      {goal.display.current}
                      <span className="text-muted-foreground text-xs ml-1">
                        / {goal.display.target}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="h-2 w-full bg-border/20 rounded-full" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full bg-linear-to-r ${goal.color} transition-all duration-700`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{percentage}% completed</span>
                  <span className={`text-sm font-medium ${
                    percentage >= 80 ? 'text-emerald-400'
                    : percentage >= 50 ? 'text-amber-400'
                    : 'text-muted-foreground'
                  }`}>
                    {percentage >= 80 ? 'On Track' : percentage >= 50 ? 'In Progress' : 'Behind'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* MRR callout */}
        {stats && stats.subscriptions.mrr > 0 && (
          <div className="mt-5 pt-4 border-t border-border/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Recurring Revenue</span>
              <span className="font-bold text-card-foreground">
                ${stats.subscriptions.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>{stats.subscriptions.byStatus['ACTIVE'] ?? 0} active subscriptions</span>
              <span>{stats.subscriptions.total} total</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}