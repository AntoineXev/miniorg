import { defineConfig } from "prisma/config";

/**
 * Prisma Configuration for Migrations
 * 
 * This config is used by Prisma CLI for migrations.
 * Runtime database connection is handled in lib/database/
 */

// Get URL from environment or use default
const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { 
    url: databaseUrl
  }
});
