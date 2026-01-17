/**
 * Prisma 7 configuration file
 * This replaces the old `url` in schema.prisma
 * See: https://pris.ly/d/config-datasource
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
}
