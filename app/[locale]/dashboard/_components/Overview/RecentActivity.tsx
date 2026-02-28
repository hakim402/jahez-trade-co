// app/[locale]/dashboard/_components/Overview/RecentActivity.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default async function RecentActivity({ userId }: { userId: string }) {
  // In a real app, fetch recent activities from database
  const activities = [
    { id: 1, type: 'request', description: 'New request for electronics', time: '2 hours ago' },
    { id: 2, type: 'booking', description: 'Video call with Guangzhou market', time: '1 day ago' },
    { id: 3, type: 'payment', description: 'Subscription payment confirmed', time: '3 days ago' },
  ];

  return (
    <Card className="bg-background/80 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-brand/10">
                <Clock className="h-4 w-4 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}