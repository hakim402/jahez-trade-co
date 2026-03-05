// app/[locale]/admin/_components/RecentActivity.tsx

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUpRight, ShieldCheck, Trash2, UserX, Bell, Eye } from 'lucide-react';
import type { RecentActivity as RecentActivityType } from '../actions';

interface Props {
  logs: RecentActivityType;
}

// Map action string → badge colour + icon
function actionMeta(action: string) {
  if (action.includes('DELETE') || action.includes('BAN'))
    return { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: action.includes('BAN') ? UserX : Trash2 };
  if (action.includes('NOTIFICATION'))
    return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Bell };
  if (action.includes('IMPERSONATE'))
    return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Eye };
  // default — update / create
  return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: ShieldCheck };
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

export function RecentActivity({ logs }: Props) {
  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-card-foreground text-lg font-semibold">
            Recent Activity
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Latest admin actions</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          asChild
        >
          <Link href="/admin/audit-logs">
            View All
            <ArrowUpRight size={16} className="ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No activity yet.
          </p>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const meta = actionMeta(log.action);
              const Icon = meta.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-accent/10 transition-colors group"
                >
                  {/* Admin avatar + action */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 border border-border/10 shrink-0">
                      <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                        {initials(log.admin.fullName, log.admin.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-card-foreground font-medium text-sm truncate">
                        {log.admin.fullName ?? log.admin.email}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {log.entity}
                        {log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Action badge + time */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <Badge
                      variant="outline"
                      className={`${meta.color} text-xs flex items-center gap-1`}
                    >
                      <Icon size={11} />
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}