// app/admin/_components/RecentActivity.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface Transaction {
  id: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  type: 'income' | 'expense';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

const transactions: Transaction[] = [
  {
    id: '1',
    user: { name: 'Sarah Johnson', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/150?img=5' },
    type: 'income',
    amount: 2500,
    status: 'completed',
    date: 'Today, 2:30 PM',
    description: 'Project payment',
  },
  {
    id: '2',
    user: { name: 'Mike Chen', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/150?img=11' },
    type: 'expense',
    amount: 450,
    status: 'completed',
    date: 'Today, 11:20 AM',
    description: 'Software subscription',
  },
  {
    id: '3',
    user: { name: 'Emily Davis', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/150?img=9' },
    type: 'income',
    amount: 1200,
    status: 'pending',
    date: 'Yesterday, 4:15 PM',
    description: 'Consulting fee',
  },
  {
    id: '4',
    user: { name: 'Alex Turner', email: 'alex@example.com', avatar: 'https://i.pravatar.cc/150?img=12' },
    type: 'expense',
    amount: 89,
    status: 'failed',
    date: 'Yesterday, 9:30 AM',
    description: 'Domain renewal',
  },
  {
    id: '5',
    user: { name: 'Lisa Wang', email: 'lisa@example.com', avatar: 'https://i.pravatar.cc/150?img=16' },
    type: 'income',
    amount: 3400,
    status: 'completed',
    date: 'Jan 22, 2024',
    description: 'Monthly retainer',
  },
];

const statusColors = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function RecentActivity() {
  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-card-foreground text-lg font-semibold">Recent Transactions</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Latest financial activities</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
        >
          View All
          <ArrowUpRight size={16} className="ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-accent/10 transition-colors group"
            >
              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border/10">
                  <AvatarImage src={transaction.user.avatar} />
                  <AvatarFallback className="bg-violet-500/20 text-violet-400">
                    {transaction.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-card-foreground font-medium text-sm">{transaction.user.name}</p>
                  <p className="text-muted-foreground text-xs">{transaction.description}</p>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {transaction.type === 'income' ? (
                      <ArrowUpRight size={16} className="text-emerald-400" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-400" />
                    )}
                    <span
                      className={`font-semibold text-sm ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{transaction.date}</p>
                </div>

                <Badge
                  variant="outline"
                  className={`${statusColors[transaction.status]} text-xs capitalize`}
                >
                  {transaction.status}
                </Badge>

                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-opacity"
                >
                  <MoreHorizontal size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}