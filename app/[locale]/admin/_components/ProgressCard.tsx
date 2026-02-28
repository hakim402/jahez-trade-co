// app/admin/_components/ProgressCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Award, Zap } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  icon: React.ElementType;
  color: string;
}

const goals: Goal[] = [
  {
    id: '1',
    title: 'Monthly Revenue Goal',
    current: 28500,
    target: 35000,
    icon: Target,
    color: 'from-violet-500 to-blue-500',
  },
  {
    id: '2',
    title: 'New Customers',
    current: 142,
    target: 200,
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: '3',
    title: 'Project Completion',
    current: 18,
    target: 25,
    icon: Award,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: '4',
    title: 'Tasks Done',
    current: 89,
    target: 100,
    icon: Zap,
    color: 'from-pink-500 to-rose-500',
  },
];

export function ProgressCard() {
  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground text-lg font-semibold">Goals Progress</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">Track your monthly targets</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-5">
          {goals.map((goal) => {
            const percentage = Math.round((goal.current / goal.target) * 100);
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg bg-linear-to-br ${goal.color} flex items-center justify-center`}
                    >
                      <goal.icon size={16} className="text-white" />
                    </div>
                    <span className="text-card-foreground text-sm font-medium">{goal.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-card-foreground text-sm font-semibold">
                      {typeof goal.current === 'number' && goal.current > 1000
                        ? `$${(goal.current / 1000).toFixed(1)}k`
                        : goal.current}
                      <span className="text-muted-foreground text-xs ml-1">
                        / {typeof goal.target === 'number' && goal.target > 1000
                          ? `$${(goal.target / 1000).toFixed(0)}k`
                          : goal.target}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-2 w-full bg-border/20 rounded-full" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full bg-linear-to-r ${goal.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{percentage}% completed</span>
                  <span className={`text-sm font-medium ${
                    percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-muted-foreground'
                  }`}>
                    {percentage >= 80 ? 'On Track' : percentage >= 50 ? 'In Progress' : 'Behind'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}