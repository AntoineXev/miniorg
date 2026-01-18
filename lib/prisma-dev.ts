import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Create a Prisma client for local development using SQLite
 * This avoids the issues with dummy D1 adapters
 */
export function createDevPrismaClient(): PrismaClient {
  // Use libsql for local development (compatible with SQLite)
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  
  const adapter = new PrismaLibSql({
    url: dbUrl
  })
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
