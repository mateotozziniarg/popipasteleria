import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body   // "email" field reused as username from the frontend
  if (!email || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    return
  }

  const usuario = await prisma.usuario.findUnique({ where: { username: String(email) } })
  const valid = usuario ? await bcrypt.compare(String(password), usuario.passwordHash) : false

  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const token = jwt.sign(
    { userId: usuario!.id, username: usuario!.username },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  )

  res.json({ token, user: { id: usuario!.id, username: usuario!.username, nombre: usuario!.nombre } })
})

router.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.userId } })
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' })
    return
  }
  res.json({ id: usuario.id, username: usuario.username, nombre: usuario.nombre })
})

export default router
