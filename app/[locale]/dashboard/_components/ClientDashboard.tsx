// app/[locale]/dashboard/_components/ClientDashboard.tsx
'use client'

import { useState } from 'react'
import { DashboardStatsCards } from './Overview/DashboardStats'
import { SubscriptionCard } from './Overview/SubscriptionCard'
import { RecentRequests } from './Overview/RecentRequests'
import { RecentBookings } from './Overview/RecentBookings'
import { RecentQuotes } from './Overview/RecentQuotes'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientHeader } from './ClientHeader'
import type { ClientDashboardStats } from './types'

interface ClientDashboardProps {
  stats: ClientDashboardStats
}

export function ClientDashboard({ stats }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <ClientHeader />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-brand to-indigo-500 bg-clip-text text-transparent">
            Welcome back, {stats.user.fullName || 'Client'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your account
          </p>
        </div>

        {/* Stats cards row */}
        <DashboardStatsCards stats={stats} />

        {/* Subscription card */}
        <SubscriptionCard subscription={stats.subscription} />

        {/* Tabs for recent activity */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="bookings">Video Calls</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Main content area */}
            <div className="lg:col-span-2">
              <TabsContent value="requests" className="mt-0">
                <RecentRequests requests={stats.requests.recent} total={stats.requests.total} />
              </TabsContent>
              <TabsContent value="bookings" className="mt-0">
                <RecentBookings bookings={stats.bookings.recent} total={stats.bookings.total} />
              </TabsContent>
              <TabsContent value="quotes" className="mt-0">
                <RecentQuotes quotes={stats.quotes.recent} total={stats.quotes.total} />
              </TabsContent>
            </div>

            {/* Side panel with status breakdown */}
            <div className="space-y-6">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Requests by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.requests.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{status}</span>
                        <Badge variant="outline" className="font-mono">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Quotes by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.quotes.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{status}</span>
                        <Badge variant="outline" className="font-mono">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Bookings by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.bookings.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{status}</span>
                        <Badge variant="outline" className="font-mono">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}