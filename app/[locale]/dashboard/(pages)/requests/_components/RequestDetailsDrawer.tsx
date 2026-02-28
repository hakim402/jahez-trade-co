'use client'

import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FileIcon, Download } from 'lucide-react'
import { getRequestDetails } from '../actions'

interface RequestDetailsDrawerProps {
  request: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestDetailsDrawer({ request, open, onOpenChange }: RequestDetailsDrawerProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && request) {
      setLoading(true)
      getRequestDetails(request.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open, request])

  const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    IN_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    QUOTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    IN_PRODUCTION: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    SHIPPED: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Request Details</DrawerTitle>
          <DrawerDescription>
            View full information about your product request.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Status and basic info */}
              <div className="flex items-center justify-between">
                <Badge className={statusStyles[details.status] || ''}>
                  {details.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {formatDate(details.createdAt)}
                </span>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-semibold mb-2">Product Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p>{details.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shipping Country</p>
                    <p>{details.shippingCountry}</p>
                  </div>
                  {details.productLink && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Product Link</p>
                      <a
                        href={details.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {details.productLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {details.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{details.description}</p>
                </div>
              )}

              {details.customNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{details.customNotes}</p>
                </div>
              )}

              {details.adminNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{details.adminNotes}</p>
                </div>
              )}

              {/* Files */}
              {details.files && details.files.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Attached Files</h3>
                  <div className="space-y-2">
                    {details.files.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.fileName || 'Unnamed file'}</span>
                          {file.fileSize && (
                            <span className="text-xs text-muted-foreground">
                              ({(file.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={file.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Download ${file.fileName || 'file'}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotes */}
              {details.quotes && details.quotes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Quotes</h3>
                  <div className="space-y-4">
                    {details.quotes.map((quote: any) => (
                      <div key={quote.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {formatCurrency(quote.price, quote.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Quoted on {formatDate(quote.createdAt)}
                            </p>
                          </div>
                          {quote.quoteFileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={quote.quoteFileUrl} download>
                                Download Quote
                              </a>
                            </Button>
                          )}
                        </div>
                        {quote.adminNotes && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            {quote.adminNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-4">Request not found</p>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}