import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { eventoId, estadoEntrega, estadoPago, fechaDesde, fechaHasta } = req.query

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        ...(eventoId ? { eventoId: parseInt(eventoId as string) } : {}),
        ...(estadoEntrega ? { estadoEntrega: estadoEntrega as any } : {}),
        ...(estadoPago ? { estadoPago: estadoPago as any } : {}),
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
      include: { evento: { select: { id: true, nombre: true, fecha: true } } },
      orderBy: [{ evento: { fecha: 'asc' } }, { createdAt: 'asc' }],
    })
    res.json(pedidos)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

export default router
