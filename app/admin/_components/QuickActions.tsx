import { Button } from '@/components/ui/button'
import { PlusCircle, Calendar, FileText, Users } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/clients/new">
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/client-requests">
          <FileText className="mr-2 h-4 w-4" /> View Requests
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/video-bookings/slots">
          <Calendar className="mr-2 h-4 w-4" /> Manage Slots
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/audit">
          <Users className="mr-2 h-4 w-4" /> Audit Logs
        </Link>
      </Button>
    </div>
  )
}