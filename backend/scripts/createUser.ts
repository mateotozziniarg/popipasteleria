import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [username, password] = process.argv.slice(2)
  if (!username || !password) {
    console.error('Uso: ts-node scripts/createUser.ts <username> <password>')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const usuario = await prisma.usuario.create({
    data: { username, passwordHash },
  })

  console.log(`✓ Usuario creado: ${usuario.username} (id: ${usuario.id})`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
