// app/[locale]/dashboard/_components/Overview/DashboardStats.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Package, Video, CreditCard } from 'lucide-react';

const statsConfig = [
  { label: 'Total Requests', key: 'requests', icon: Package, color: 'bg-blue-500' },
  { label: 'Video Bookings', key: 'bookings', icon: Video, color: 'bg-purple-500' },
  { label: 'Payments', key: 'payments', icon: CreditCard, color: 'bg-green-500' },
];

export default function DashboardStats({ stats }: { stats: { requests: number; bookings: number; payments: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsConfig.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="group bg-background/80 backdrop-blur-sm border border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <CardContent className="p-6 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-3xl font-bold mt-2">{stats[item.key as keyof typeof stats]}</p>
              </div>
              <div className={`p-3 rounded-xl ${item.color} bg-opacity-10`}>
                <Icon className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand group-hover:w-full transition-all duration-300" />
          </Card>
        );
      })}
    </div>
  );
}