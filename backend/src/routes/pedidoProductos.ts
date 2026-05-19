import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router({ mergeParams: true })

router.get('/', async (req: Request, res: Response) => {
  const pedidoId = parseInt(req.params.pedidoId as string)
  try {
    const items = await prisma.pedidoProducto.findMany({
      where: { pedidoId },
      include: { producto: true },
    })
    res.json(items)
  } catch {
    res.status(500).json({ error: 'Error al obtener productos del pedido' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const pedidoId = parseInt(req.params.pedidoId as string)
  const { productoId, cantidad, precioUnitario } = req.body
  if (!productoId || !cantidad || precioUnitario === undefined) {
    res.status(400).json({ error: 'productoId, cantidad y precioUnitario son requeridos' })
    return
  }
  try {
    const item = await prisma.pedidoProducto.create({
      data: { pedidoId, productoId, cantidad, precioUnitario },
      include: { producto: true },
    })
    res.status(201).json(item)
  } catch (error: any) {
    if (error?.code === 'P2003') {
      res.status(404).json({ error: 'Pedido o producto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al agregar producto al pedido' })
  }
})

router.put('/:productoId', async (req: Request, res: Response) => {
  const pedidoId = parseInt(req.params.pedidoId as string)
  const productoId = parseInt(req.params.productoId as string)
  const { cantidad, precioUnitario } = req.body
  try {
    const item = await prisma.pedidoProducto.updateMany({
      where: { pedidoId, productoId },
      data: {
        ...(cantidad !== undefined && { cantidad }),
        ...(precioUnitario !== undefined && { precioUnitario }),
      },
    })
    if (item.count === 0) {
      res.status(404).json({ error: 'Producto no encontrado en este pedido' })
      return
    }
    const updated = await prisma.pedidoProducto.findFirst({
      where: { pedidoId, productoId },
      include: { producto: true },
    })
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Error al actualizar producto del pedido' })
  }
})

router.delete('/:productoId', async (req: Request, res: Response) => {
  const pedidoId = parseInt(req.params.pedidoId as string)
  const productoId = parseInt(req.params.productoId as string)
  try {
    const deleted = await prisma.pedidoProducto.deleteMany({
      where: { pedidoId, productoId },
    })
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Producto no encontrado en este pedido' })
      return
    }
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error al quitar producto del pedido' })
  }
})

export default router
