import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma Configuration for Migrations
 *
 * This config is used by Prisma CLI for migrations.
 * Runtime database connection is handled in lib/database/
 */

// Get URL from environment or use default (absolute path for SQLite)
const databaseUrl = process.env.DATABASE_URL || `file:${path.resolve(__dirname, "../dev.db")}`;

export default defineConfig({
  schema: './schema.prisma',
  migrations: { path: './migrations' },
  datasource: {
    url: databaseUrl
  }
});
