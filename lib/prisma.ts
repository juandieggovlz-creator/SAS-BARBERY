import { PrismaClient } from '@prisma/client'

// ─── Singleton con manejo robusto para Neon serverless ──────────────────────
// Neon PostgreSQL suspende conexiones inactivas (error E57P01).
// Esta configuración limita el pool y deja que Prisma reconecte automáticamente.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ─── Helper: ejecutar query con reintento automático ─────────────────────────
// Usa esto envolviendo llamadas a Prisma cuando necesites máxima resiliencia.
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      const isNeonDisconnect =
        error?.code === 'P1001' ||
        error?.code === 'P1002' ||
        error?.code === 'P1017' ||
        error?.message?.includes('E57P01') ||
        error?.message?.includes('terminating connection') ||
        error?.message?.includes('Connection refused')

      if (isNeonDisconnect && i < retries) {
        // Espera breve antes de reintentar (100ms, 300ms)
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1) * 3))
        continue
      }
      throw err
    }
  }
  throw new Error('withRetry: max retries exceeded')
}
