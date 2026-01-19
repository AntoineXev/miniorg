/**
 * Prisma Client Factory
 * Creates the appropriate Prisma client based on configuration
 */

import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig } from './config'
// Import dynamique des adapters pour éviter de charger local-sqlite dans le middleware
// import { D1Adapter, LocalSQLiteAdapter } from './adapters'

/**
 * Create a Prisma client instance based on the current environment configuration
 */
export function createPrismaClient(): PrismaClient {
  const config = getDatabaseConfig()
  
  console.log(`[Prisma] Using database adapter: ${config.adapter}`)

  // En build Cloudflare, forcer D1 et bloquer les autres adapters
  if (process.env.BUILD_TARGET === 'cloudflare') {
    if (config.adapter !== 'd1') {
      console.warn(`[Prisma] Forcing D1 adapter for Cloudflare build (was ${config.adapter})`)
    }
    const { D1Adapter } = require('./adapters/d1')
    return new D1Adapter().createClient()
  }

  switch (config.adapter) {
    case 'd1': {
      // Import lazy pour éviter de charger tous les adapters
      const { D1Adapter } = require('./adapters/d1')
      return new D1Adapter().createClient()
    }
    
    case 'local-sqlite': {
      // Vérification supplémentaire au cas où
      if (process.env.BUILD_TARGET === 'cloudflare') {
        throw new Error('local-sqlite adapter is not available in Cloudflare builds')
      }
      // Import lazy pour éviter de charger local-sqlite dans le middleware Cloudflare
      const { LocalSQLiteAdapter } = require('./adapters/local-sqlite')
      return new LocalSQLiteAdapter(config).createClient()
    }
    
    case 'postgres':
    case 'libsql':
      throw new Error(`${config.adapter} adapter not yet implemented`)
    
    default:
      throw new Error(`Unknown database adapter: ${config.adapter}`)
  }
}
