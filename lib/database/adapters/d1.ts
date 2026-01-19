/**
 * Cloudflare D1 Database Adapter
 * Uses @prisma/adapter-d1 with Cloudflare Workers binding
 */

import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Type for Cloudflare env with D1 binding
interface CloudflareEnv extends Record<string, unknown> {
  DB: {
    prepare(query: string): any
    bind(...values: any[]): any
    exec(query: string): Promise<any>
    batch(statements: any[]): Promise<any[]>
  }
}

export class D1Adapter {
  createClient(): PrismaClient {
    try {
      const context = getCloudflareContext<CloudflareEnv>()
      const env = context.env as CloudflareEnv
      const adapter = new PrismaD1(env.DB as any)
      
      return new PrismaClient({ adapter })
    } catch (error) {
      throw new Error(
        'D1 database binding is required. Ensure you are running on Cloudflare Workers or use wrangler dev. ' +
        'Error: ' + (error instanceof Error ? error.message : String(error))
      )
    }
  }
}
