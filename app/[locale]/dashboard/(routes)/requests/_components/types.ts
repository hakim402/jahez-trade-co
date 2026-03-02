import { RequestStatus, QuoteStatus, User, Quote, RequestStatusHistory } from '@prisma/client'

export type TransformedQuote = Omit<Quote, 'price'> & { price: string }

export type ClientRequestWithRelations = {
  id: string
  clientId: string
  productLink: string | null
  description: string | null
  quantity: number
  shippingCountry: string
  customNotes: string | null
  status: RequestStatus
  priority: number
  acceptedQuoteId: string | null
  acceptedQuote: TransformedQuote | null
  aiParsedData: any | null
  aiEstimatedPrice: number | null
  aiConfidence: number | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  quotes: (TransformedQuote & {
    createdBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
  files: any[]
  statusHistory: (RequestStatusHistory & {
    changedBy: Pick<User, 'id' | 'email' | 'fullName'>
  })[]
}