// app/admin/_components/StatsCard.tsx

import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: LucideIcon;
  gradient: 'purple-blue' | 'purple-pink' | 'blue-cyan' | 'amber-orange' | 'emerald-teal';
}

const gradients = {
  'purple-blue': 'gradient-purple-blue',
  'purple-pink': 'gradient-purple-pink',
  'blue-cyan': 'gradient-blue-cyan',
  'amber-orange': 'gradient-amber-orange',
  'emerald-teal': 'gradient-emerald-teal',
};

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient,
}: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden bg-card/50 border-border/5 p-6 card-hover cursor-pointer">
      {/* Background Gradient Glow */}
      <div
        className={cn(
          'absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl',
          gradients[gradient]
        )}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              gradients[gradient]
            )}
          >
            <Icon className="text-white" size={24} />
          </div>

          {/* Change Badge */}
          <div
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{change}%
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-card-foreground mt-1">{value}</h3>
          <p className="text-muted-foreground text-xs mt-2">{changeLabel}</p>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1',
          gradients[gradient]
        )}
      />
    </Card>
  );
}