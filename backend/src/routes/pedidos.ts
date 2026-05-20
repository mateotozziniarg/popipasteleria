import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router({ mergeParams: true })

router.get('/', async (req: Request, res: Response) => {
  const eventoId = parseInt(req.params.eventoId as string)
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { eventoId },
      orderBy: { createdAt: 'asc' },
      include: { productos: { include: { producto: true } } },
    })
    res.json(pedidos)
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const eventoId = parseInt(req.params.eventoId as string)
  const { nombreCliente, telefono, descripcion, precioTotal, estadoEntrega, estadoPago, notas, montoSeña } = req.body
  if (!nombreCliente || precioTotal === undefined) {
    res.status(400).json({ error: 'nombreCliente y precioTotal son requeridos' })
    return
  }
  try {
    const pedido = await prisma.pedido.create({
      data: {
        eventoId,
        nombreCliente,
        telefono,
        descripcion,
        precioTotal,
        ...(estadoEntrega && { estadoEntrega }),
        ...(estadoPago && { estadoPago }),
        notas,
        ...(montoSeña !== undefined && montoSeña !== null && { montoSeña }),
      },
    })
    res.status(201).json(pedido)
  } catch (error: any) {
    if (error?.code === 'P2003') {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al crear pedido' })
  }
})

router.put('/:pedidoId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.pedidoId as string)
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

router.delete('/:pedidoId', async (req: Request, res: Response) => {
  const id = parseInt(req.params.pedidoId as string)
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
