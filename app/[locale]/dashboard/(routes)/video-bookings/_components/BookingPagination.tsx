'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface BookingPaginationProps {
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: any
}

export function BookingPagination({ pagination }: BookingPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { page, totalPages } = pagination

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderPageNumbers = () => {
    const items = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === page}
            onClick={(e) => {
              e.preventDefault()
              goToPage(i)
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (start > 2) {
      items.unshift(<PaginationEllipsis key="start-ellipsis" />)
      items.unshift(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goToPage(1)
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
    } else if (start === 2) {
      items.unshift(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goToPage(1)
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (end < totalPages - 1) {
      items.push(<PaginationEllipsis key="end-ellipsis" />)
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goToPage(totalPages)
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    } else if (end === totalPages - 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goToPage(totalPages)
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page > 1) goToPage(page - 1)
            }}
            className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {renderPageNumbers()}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (page < totalPages) goToPage(page + 1)
            }}
            className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}