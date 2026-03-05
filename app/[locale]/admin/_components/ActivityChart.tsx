// app/[locale]/admin/_components/ActivityChart.tsx

'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RevenueBreakdown } from '../actions';

interface Props {
  revenueData: RevenueBreakdown;
}

// Format ISO date key → short weekday label
function shortDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

const timeRanges = ['Day', 'Week', 'Month', 'Year'];

export function ActivityChart({ revenueData }: Props) {
  const [activeRange, setActiveRange] = useState('Week');

  // Map real data → chart shape
  const chartData = revenueData.map((d) => ({
    name:     shortDay(d.date),
    revenue:  d.revenue,
    attempts: d.attempts,
  }));

  // Fallback to placeholder if no data yet
  const data = chartData.length > 0 ? chartData : [
    { name: 'Mon', revenue: 0, attempts: 0 },
    { name: 'Tue', revenue: 0, attempts: 0 },
    { name: 'Wed', revenue: 0, attempts: 0 },
    { name: 'Thu', revenue: 0, attempts: 0 },
    { name: 'Fri', revenue: 0, attempts: 0 },
    { name: 'Sat', revenue: 0, attempts: 0 },
    { name: 'Sun', revenue: 0, attempts: 0 },
  ];

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalAttempts = revenueData.reduce((s, d) => s + d.attempts, 0);

  return (
    <Card className="bg-card/50 border-border/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-card-foreground text-lg font-semibold">
            Revenue Overview
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {totalAttempts > 0
              ? `${totalAttempts} payment${totalAttempts !== 1 ? 's' : ''} · $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total`
              : 'No revenue data yet'}
          </p>
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setActiveRange(range)}
              className={`text-xs px-3 py-1 rounded-lg transition-all ${
                activeRange === range
                  ? 'bg-color/20 text-color border border-color/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: 'var(--popover-foreground)', marginBottom: '8px' }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Payments',
                ]}
              />
              <Area
                type="monotone" dataKey="revenue"
                stroke="#8b5cf6" strokeWidth={3}
                fillOpacity={1} fill="url(#colorRevenue)"
                name="revenue"
              />
              <Area
                type="monotone" dataKey="attempts"
                stroke="#3b82f6" strokeWidth={3}
                fillOpacity={1} fill="url(#colorAttempts)"
                name="attempts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-muted-foreground text-sm">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground text-sm">Payment Count</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}