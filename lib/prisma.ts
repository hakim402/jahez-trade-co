// lib/prisma.ts

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  var prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is available
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Create a PostgreSQL connection pool
const pool = new Pool({ connectionString })

// Type assertion avoids TS conflict between different @types/pg versions
const adapter = new PrismaPg(pool as any)

// Instantiate Prisma Client with the adapter
export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma