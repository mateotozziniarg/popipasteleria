import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { eventoId, sinEvento, estadoEntrega, estadoPago, fechaDesde, fechaHasta, filtroPor, ordenarPor, sinFecha, search } = req.query

  let dateFilter = {}
  if (fechaDesde || fechaHasta) {
    const field = filtroPor === 'entrega' ? 'fechaEntrega' : 'createdAt'
    dateFilter = {
      [field]: {
        ...(fechaDesde ? { gte: new Date(fechaDesde as string) } : {}),
        ...(fechaHasta ? { lte: new Date(new Date(fechaHasta as string).setHours(23, 59, 59, 999)) } : {}),
      },
    }
  }

  const orderBy: any = ordenarPor === 'fechaEntrega'
    ? [{ fechaEntrega: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }]
    : { createdAt: 'desc' }

  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        ...(eventoId ? { eventoId: parseInt(eventoId as string) } : {}),
        ...(sinEvento === 'true' ? { eventoId: null } : {}),
        ...(estadoEntrega ? { estadoEntrega: estadoEntrega as any } : {}),
        ...(estadoPago ? { estadoPago: estadoPago as any } : {}),
        ...(sinFecha === 'true' ? { fechaEntrega: null } : {}),
        ...(search ? { nombreCliente: { contains: search as string, mode: 'insensitive' } } : {}),
        ...dateFilter,
      },
      include: {
        evento: { select: { id: true, nombre: true, fecha: true } },
        cliente: { select: { id: true, nombre: true, telefono: true } },
        productos: { include: { producto: true } },
      },
      orderBy,
    })
    res.json(pedidos)
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { nombreCliente, telefono, descripcion, precioTotal, estadoEntrega, estadoPago, notas, montoSeña, clienteId, eventoId, fechaEntrega } = req.body
  if (!nombreCliente || precioTotal === undefined) {
    res.status(400).json({ error: 'nombreCliente y precioTotal son requeridos' })
    return
  }
  try {
    const pedido = await prisma.pedido.create({
      data: {
        eventoId: eventoId ? Number(eventoId) : null,
        nombreCliente,
        telefono,
        descripcion,
        precioTotal,
        ...(estadoEntrega && { estadoEntrega }),
        ...(estadoPago && { estadoPago }),
        notas,
        ...(montoSeña !== undefined && montoSeña !== null && { montoSeña }),
        ...(clienteId !== undefined && clienteId !== null && { clienteId }),
        ...(fechaEntrega ? { fechaEntrega: new Date(fechaEntrega) } : {}),
      },
    })
    res.status(201).json(pedido)
  } catch {
    res.status(500).json({ error: 'Error al crear pedido' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombreCliente, telefono, descripcion, precioTotal, estadoEntrega, estadoPago, notas, montoSeña, clienteId, eventoId, fechaEntrega } = req.body
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
        ...(clienteId !== undefined && { clienteId: clienteId === null ? null : clienteId }),
        ...(eventoId !== undefined && { eventoId: eventoId === null ? null : Number(eventoId) }),
        ...(fechaEntrega !== undefined && { fechaEntrega: fechaEntrega === null ? null : new Date(fechaEntrega) }),
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
    await prisma.$transaction([
      prisma.pedidoProducto.deleteMany({ where: { pedidoId: id } }),
      prisma.pedido.delete({ where: { id } }),
    ])
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
