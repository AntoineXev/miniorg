/**
 * Local SQLite Database Adapter
 * Uses standard Prisma client with SQLite file (Node.js runtime only)
 */

import { PrismaClient } from '@prisma/client'
import type { DatabaseConfig } from '../config'

export class LocalSQLiteAdapter {
  private config: DatabaseConfig

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  createClient(): PrismaClient {
    if (!this.config.url) {
      throw new Error(
        'DATABASE_URL is required for local-sqlite adapter. ' +
        'Set DATABASE_URL=file:./dev.db in your .env.local file'
      )
    }

    // Import dynamique lazy pour éviter d'inclure @prisma/adapter-libsql dans le build Cloudflare
    // Le module ne sera chargé que lors de l'exécution si on utilise vraiment cet adapter
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    
    const adapter = new PrismaLibSql({
        url: this.config.url,
    })

    // Standard Prisma client for Node.js runtime (not edge)
    // SQLite requires filesystem access which is not available in edge runtime
    // The database URL is configured via DATABASE_URL environment variable
    return new PrismaClient({
        adapter,
        log: ['error', 'warn'],
    })
  }
}
