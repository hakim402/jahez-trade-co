import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export function RecentUsers({ users }: { users: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl || ''} />
              <AvatarFallback>{user.fullName?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName || 'No name'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent users</p>
        )}
        <Link
          href="/admin/clients"
          className="text-sm text-primary hover:underline block mt-2"
        >
          View all users →
        </Link>
      </CardContent>
    </Card>
  )
}