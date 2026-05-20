'use strict'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Si la tabla tiene columna "email" en vez de "username", la renombramos
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Usuario" RENAME COLUMN "email" TO "username"
    `)
    console.log('[fixDb] Renamed column email → username')
  } catch {
    // Ya se llama username, o la tabla no existe todavía — OK
  }

  // Eliminar registro de migración fallida para que Prisma pueda continuar
  try {
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name IN (
        '20260520000001_seed_usuario',
        '20260520000000_add_usuarios'
      )
      AND finished_at IS NULL
    `)
    console.log('[fixDb] Cleaned failed migration records')
  } catch {
    // La tabla _prisma_migrations puede no existir aún — OK
  }
}

main()
  .catch(e => console.error('[fixDb] non-fatal:', e.message))
  .finally(() => prisma.$disconnect().then(() => process.exit(0)))
