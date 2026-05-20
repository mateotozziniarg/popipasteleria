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
              createdAt: {
                ...(fechaDesde ? { gte: new Date(fechaDesde as string) } : {}),
                ...(fechaHasta ? { lte: new Date(fechaHasta as string) } : {}),
              },
            }
          : {}),
      },
      include: { evento: { select: { id: true, nombre: true, fecha: true } } },
      orderBy: [{ evento: { fecha: 'asc' } }, { createdAt: 'asc' }],
    })
    res.json(pedidos)
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombreCliente, telefono, descripcion, precioTotal, estadoEntrega, estadoPago, notas, montoSeña } = req.body
  try {
    const pedido = await prisma.pedido.update({
      where: { id },
      data: {
        ...(nombreCliente !== undefined && { nombreCliente }),
        ...(telefono !== undefined && { telefono }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precioTotal !== undefined && { precioTotal }),
        ...(estadoEntrega !== undefined && { estadoEntrega }),
        ...(estadoPago !== undefined && { estadoPago }),
        ...(notas !== undefined && { notas }),
        ...(montoSeña !== undefined && { montoSeña: montoSeña === null ? null : montoSeña }),
      },
    })
    res.json(pedido)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Pedido no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar pedido' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    await prisma.pedido.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Pedido no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar pedido' })
  }
})

export default router
