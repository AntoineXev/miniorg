/**
 * Database adapter configuration
 * Centralized configuration for switching between different Prisma adapters
 */

export type DatabaseAdapter = 'local-sqlite' | 'd1' | 'postgres' | 'libsql'

export interface DatabaseConfig {
  adapter: DatabaseAdapter
  url?: string
  // Future: add adapter-specific options here
}

/**
 * Get database configuration based on environment variables
 * Priority:
 * 1. Explicit DB_ADAPTER env var
 * 2. Auto-detection based on DATABASE_URL presence
 * 3. Default to D1 (Cloudflare production)
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Priority 1: Explicit adapter via env var
  const explicitAdapter = process.env.DB_ADAPTER as DatabaseAdapter | undefined
  
  if (explicitAdapter) {
    return { 
      adapter: explicitAdapter, 
      url: process.env.DATABASE_URL 
    }
  }
  
  // Priority 2: Auto-detect based on DATABASE_URL
  // In Prisma 7, DATABASE_URL is read from prisma.config.ts at runtime
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL
    
    // Detect adapter type from URL format
    if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
      return { adapter: 'postgres', url }
    }
    
    if (url.startsWith('libsql://')) {
      return { adapter: 'libsql', url }
    }
    
    // Default to local SQLite for file: URLs or plain paths
    return { adapter: 'local-sqlite', url }
  }
  
  // Priority 3: Default to D1 for Cloudflare Workers
  return { adapter: 'd1' }
}
