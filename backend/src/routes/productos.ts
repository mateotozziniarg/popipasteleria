import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({ orderBy: { nombre: 'asc' } })
    res.json(productos)
  } catch {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, descripcion, precioDefault } = req.body
  if (!nombre || precioDefault === undefined) {
    res.status(400).json({ error: 'nombre y precioDefault son requeridos' })
    return
  }
  try {
    const producto = await prisma.producto.create({
      data: { nombre, descripcion, precioDefault },
    })
    res.status(201).json(producto)
  } catch {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombre, descripcion, precioDefault } = req.body
  try {
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precioDefault !== undefined && { precioDefault }),
      },
    })
    res.json(producto)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const enUso = await prisma.pedidoProducto.count({ where: { productoId: id } })
    if (enUso > 0) {
      res.status(409).json({ error: `No se puede eliminar: el producto está en ${enUso} pedido${enUso > 1 ? 's' : ''}` })
      return
    }
    await prisma.producto.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Producto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar producto' })
  }
})

export default router
