import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta } = req.query
  if (!fechaDesde || !fechaHasta) {
    res.status(400).json({ error: 'fechaDesde y fechaHasta son requeridos' })
    return
  }
  const desde = new Date(fechaDesde as string)
  const hasta = new Date(`${fechaHasta as string}T23:59:59`)

  try {
    const [pedidos, tareas] = await Promise.all([
      prisma.pedido.findMany({
        where: { fechaEntrega: { gte: desde, lte: hasta } },
        include: {
          productos: { include: { producto: { select: { nombre: true } } } },
          evento: { select: { id: true, nombre: true } },
          cliente: { select: { id: true, nombre: true, telefono: true } },
        },
        orderBy: { fechaEntrega: 'asc' },
      }),
      prisma.tarea.findMany({
        where: { fecha: { gte: desde, lte: hasta } },
        include: {
          menciones: {
            include: {
              cliente: { select: { id: true, nombre: true } },
              pedido: { select: { id: true, nombreCliente: true, descripcion: true } },
            },
          },
        },
        orderBy: { fecha: 'asc' },
      }),
    ])

    res.json({
      pedidos: pedidos.map(p => ({
        id: p.id,
        nombreCliente: p.nombreCliente,
        telefono: p.telefono ?? p.cliente?.telefono ?? null,
        fechaEntrega: p.fechaEntrega,
        estadoEntrega: p.estadoEntrega,
        estadoPago: p.estadoPago,
        modalidadEntrega: p.modalidadEntrega,
        precioTotal: p.precioTotal,
        montoSeña: p.montoSeña,
        notas: p.notas,
        descripcion: p.descripcion,
        eventoNombre: p.evento?.nombre ?? null,
        eventoId: p.eventoId,
        clienteId: p.clienteId,
        productos: p.productos.map(pp => ({ nombre: pp.producto.nombre, cantidad: pp.cantidad })),
      })),
      tareas,
    })
  } catch {
    res.status(500).json({ error: 'Error al obtener calendario' })
  }
})

export default router
