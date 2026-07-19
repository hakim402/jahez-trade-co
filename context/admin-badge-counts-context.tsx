'use client'

import { createContext, useContext, ReactNode } from 'react'

type BadgeCounts = {
  productRequests:   number
  videoBookings:     number
  consultingRequests: number
  support:           number
  notifications:     number
  audit:             number
}

const BadgeCountsContext = createContext<BadgeCounts | undefined>(undefined)

export function BadgeCountsProvider({
  children,
  counts,
}: {
  children: ReactNode
  counts: BadgeCounts
}) {
  return (
    <BadgeCountsContext.Provider value={counts}>
      {children}
    </BadgeCountsContext.Provider>
  )
}

export function useBadgeCounts() {
  const context = useContext(BadgeCountsContext)
  if (context === undefined) {
    throw new Error('useBadgeCounts must be used within a BadgeCountsProvider')
  }
  return context
}