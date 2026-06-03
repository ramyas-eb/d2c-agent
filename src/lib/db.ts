import { PrismaClient } from '@/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

function makeClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = remoteUrl
    ? new PrismaLibSql({ url: remoteUrl, authToken })
    : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), 'dev.db')}` });

  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Prevent multiple Prisma Client instances during Next.js hot-reload
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? makeClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
