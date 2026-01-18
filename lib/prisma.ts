import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Type for Cloudflare env with D1 binding
// Note: Types will be generated via `npm run db:types` from wrangler.toml
// For now, using a type that matches the D1Database interface
interface CloudflareEnv extends Record<string, unknown> {
  DB: {
    prepare(query: string): any
    bind(...values: any[]): any
    exec(query: string): Promise<any>
    batch(statements: any[]): Promise<any[]>
  }
}

// Get Prisma client with D1 adapter
// This function must be called within a request handler where Cloudflare context is available
export function getPrisma(): PrismaClient {
  try {
    const context = getCloudflareContext<CloudflareEnv>()
    const env = context.env as CloudflareEnv
    const adapter = new PrismaD1(env.DB as any)
    return new PrismaClient({ adapter })
  } catch (error) {
    // This should not happen in production on Cloudflare Workers
    // but can happen during build/static generation
    throw new Error(
      'D1 database binding is required. Ensure you are running on Cloudflare Workers or use wrangler dev. ' +
      'If this occurs during build, ensure SSG routes handle the Cloudflare context properly.'
    )
  }
}

// For backward compatibility, export a lazy getter
// Note: This will fail if called outside a Cloudflare context
// All routes using this should be Edge/Server routes, not static pages
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = client[prop as keyof PrismaClient]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
