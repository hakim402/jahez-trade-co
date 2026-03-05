// app/[locale]/dashboard/_components/Overview/NotificationsPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bell, CheckCheck, MoreVertical, Trash2, Eye, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { 
  getClientDashboardStats, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  deleteAllNotifications 
} from '../../actions'
import { toast } from 'sonner'
import type { ClientDashboardStats } from '../types'

export function NotificationsPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ClientDashboardStats['notifications'] | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)

  const fetchNotifications = async () => {
    const result = await getClientDashboardStats()
    if (result.success) {
      setNotifications(result.data.notifications)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Refetch when popover opens to ensure fresh data
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id)
    if (result.success) {
      toast.success('Marked as read')
      fetchNotifications()
      router.refresh()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.success) {
      toast.success('All notifications marked as read')
      fetchNotifications()
      router.refresh()
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteNotification(id)
    if (result.success) {
      toast.success('Notification deleted')
      fetchNotifications()
      router.refresh()
    } else {
      toast.error('Error', { description: result.error })
    }
    setDeleteDialogOpen(false)
    setNotificationToDelete(null)
  }

  const handleDeleteAll = async () => {
    const result = await deleteAllNotifications()
    if (result.success) {
      toast.success('All notifications deleted')
      fetchNotifications()
      router.refresh()
    } else {
      toast.error('Error', { description: result.error })
    }
    setDeleteAllDialogOpen(false)
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id)
    }
    
    // Navigate based on type
    if (notification.type.includes('REQUEST') && notification.metadata?.requestId) {
      router.push(`/dashboard/my-requests?highlight=${notification.metadata.requestId}`)
    } else if (notification.type.includes('BOOKING') && notification.metadata?.bookingId) {
      router.push(`/dashboard/video-bookings?highlight=${notification.metadata.bookingId}`)
    } else if (notification.type.includes('QUOTE') && notification.metadata?.quoteId) {
      router.push(`/dashboard/my-requests?highlight=${notification.metadata.requestId}`)
    } else {
      router.push('/dashboard')
    }
    setOpen(false)
  }

  const unreadCount = notifications?.unreadCount ?? 0
  const recent = notifications?.recent ?? []

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative cursor-pointer">
            <Bell className="h-4 w-4 text-color" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand text-[10px] font-medium text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-semibold">Notifications</h4>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              {recent.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                  onClick={() => setDeleteAllDialogOpen(true)}
                  title="Delete all"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="h-80">
            {recent.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-muted/50 transition-colors group relative',
                      !notification.isRead && 'bg-muted/20'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="flex-1 cursor-pointer min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <span className="h-2 w-2 mt-1.5 rounded-full bg-brand shrink-0" />
                          )}
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium pr-6">{notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {!notification.isRead && (
                            <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                              <Eye className="mr-2 h-4 w-4" /> Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setNotificationToDelete(notification.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete single notification confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notificationToDelete && handleDelete(notificationToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all notifications confirmation */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}