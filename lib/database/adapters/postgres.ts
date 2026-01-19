/**
 * PostgreSQL Database Adapter
 * Prepared for future use with Neon, Supabase, or other PostgreSQL providers
 */

import { PrismaClient } from '@prisma/client'
import type { DatabaseConfig } from '../config'

export class PostgresAdapter {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  createClient(): PrismaClient {
    if (!this.config.url) {
      throw new Error(
        'DATABASE_URL is required for postgres adapter. ' +
        'Set DATABASE_URL=postgresql://... in your environment'
      )
    }

    // For Prisma 7, the URL is read from process.env.DATABASE_URL via prisma.config.ts
    // Could be enhanced with @prisma/adapter-neon or similar for connection pooling
    return new PrismaClient({
      log: ['error', 'warn'],
    })
  }
}
