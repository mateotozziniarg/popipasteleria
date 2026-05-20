import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { search } = req.query
  try {
    const clientes = await prisma.cliente.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: search as string, mode: 'insensitive' } },
              { telefono: { contains: search as string, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { nombre: 'asc' },
    })
    res.json(clientes)
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, telefono, direccion, notas } = req.body
  if (!nombre) {
    res.status(400).json({ error: 'nombre es requerido' })
    return
  }
  try {
    const cliente = await prisma.cliente.create({
      data: { nombre, telefono, direccion, notas },
    })
    res.status(201).json(cliente)
  } catch {
    res.status(500).json({ error: 'Error al crear cliente' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombre, telefono, direccion, notas } = req.body
  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(telefono !== undefined && { telefono }),
        ...(direccion !== undefined && { direccion }),
        ...(notas !== undefined && { notas }),
      },
    })
    res.json(cliente)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Cliente no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const pedidosCount = await prisma.pedido.count({ where: { clienteId: id } })
    if (pedidosCount > 0) {
      res.status(409).json({
        error: `No se puede eliminar: el cliente tiene ${pedidosCount} pedido${pedidosCount > 1 ? 's' : ''} asociado${pedidosCount > 1 ? 's' : ''}`,
      })
      return
    }
    await prisma.cliente.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Cliente no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar cliente' })
  }
})

export default router
