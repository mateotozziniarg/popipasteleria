import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { eventoId, fechaDesde, fechaHasta } = req.query
  try {
    const gastos = await prisma.eventoGasto.findMany({
      where: {
        ...(eventoId ? { eventoId: parseInt(eventoId as string) } : {}),
        ...(fechaDesde || fechaHasta
          ? {
              evento: {
                fecha: {
                  ...(fechaDesde ? { gte: new Date(fechaDesde as string) } : {}),
                  ...(fechaHasta ? { lte: new Date(fechaHasta as string) } : {}),
                },
              },
            }
          : {}),
      },
      select: { cantidad: true, precioUnitario: true },
    })
    const total = gastos.reduce(
      (s, g) => s + parseFloat(g.cantidad.toString()) * parseFloat(g.precioUnitario.toString()),
      0
    )
    res.json({ total })
  } catch {
    res.status(500).json({ error: 'Error al obtener total de gastos' })
  }
})

export default router
