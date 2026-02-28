// app/admin/_components/QuickActions.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Send,
  Download,
  Users,
  FileText,
  CreditCard,
  Settings,
  Calendar,
} from 'lucide-react';

const quickActions = [
  { icon: Plus, label: 'New Project', color: 'from-violet-500 to-purple-500' },
  { icon: Send, label: 'Send Money', color: 'from-blue-500 to-cyan-500' },
  { icon: Download, label: 'Download Report', color: 'from-emerald-500 to-teal-500' },
  { icon: Users, label: 'Add Member', color: 'from-amber-500 to-orange-500' },
  { icon: FileText, label: 'Create Invoice', color: 'from-pink-500 to-rose-500' },
  { icon: CreditCard, label: 'Add Card', color: 'from-indigo-500 to-blue-500' },
  { icon: Calendar, label: 'Schedule', color: 'from-cyan-500 to-blue-500' },
  { icon: Settings, label: 'Settings', color: 'from-slate-500 to-slate-400' },
];

export function QuickActions() {
  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-card-foreground text-lg font-semibold">Quick Actions</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">Frequently used actions</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className="flex flex-col items-center justify-center gap-2 h-auto py-4 px-2 bg-muted/20 hover:bg-accent/20 border border-border/5 hover:border-border/10 rounded-xl transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-linear-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon size={20} className="text-white" />
              </div>
              <span className="text-muted-foreground text-xs font-medium text-center">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}