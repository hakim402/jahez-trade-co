'use client'

import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatTime } from '@/lib/utils'
import { Calendar, User, Hash, FileText } from 'lucide-react'

type AuditDetailsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: {
    admin: {
      avatarUrl?: string;
      fullName?: string;
      email: string;
    };
    createdAt: string | Date;
    action: string;
    entity: string;
    entityId?: string | number;
    changes?: Record<string, any>;
  } | null;
};

export function AuditDetailsDrawer({ open, onOpenChange, log }: AuditDetailsDrawerProps) {
  if (!log) return null

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Audit Log Details</DrawerTitle>
          <DrawerDescription>Full information about this admin action.</DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-6">
            {/* Admin info */}
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={log.admin.avatarUrl} />
                <AvatarFallback>{log.admin.fullName?.charAt(0) || log.admin.email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{log.admin.fullName || 'No name'}</h3>
                <p className="text-sm text-muted-foreground">{log.admin.email}</p>
              </div>
            </div>
            <Separator />
            {/* Log metadata */}
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(log.createdAt)} at {formatTime(log.createdAt)}</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Action: <Badge variant="outline">{log.action}</Badge></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4" /> Entity: {log.entity}</div>
              {log.entityId && (
                <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> Entity ID: <span className="font-mono">{log.entityId}</span></div>
              )}
            </div>
            {/* Changes JSON */}
            {log.changes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Changes</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}