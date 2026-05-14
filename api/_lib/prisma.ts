// Singleton Prisma client.
//
// In serverless (Vercel functions), each cold-started function spins up a fresh
// Node process. But Vercel may reuse warm functions across requests, so we
// cache the client on globalThis to avoid hitting Supabase's connection limit
// when many requests share the same process.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}
