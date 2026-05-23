import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

const mencionInclude = {
  menciones: {
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true } },
      pedido: { select: { id: true, nombreCliente: true, descripcion: true } },
    },
  },
}

router.get('/', async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta, completada } = req.query
  const where: Record<string, unknown> = {}
  if (fechaDesde || fechaHasta) {
    where.fecha = {
      ...(fechaDesde ? { gte: new Date(fechaDesde as string) } : {}),
      ...(fechaHasta ? { lte: new Date(`${fechaHasta as string}T23:59:59`) } : {}),
    }
  }
  if (completada !== undefined) {
    where.completada = completada === 'true'
  }
  try {
    const tareas = await prisma.tarea.findMany({ where, include: mencionInclude, orderBy: { fecha: 'asc' } })
    res.json(tareas)
  } catch {
    res.status(500).json({ error: 'Error al obtener tareas' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { texto, fecha, menciones = [] } = req.body
  if (!texto || !fecha) {
    res.status(400).json({ error: 'texto y fecha son requeridos' })
    return
  }
  try {
    const tarea = await prisma.tarea.create({
      data: {
        texto,
        fecha: new Date(fecha),
        menciones: {
          create: menciones.map((m: { tipo: string; clienteId?: number; pedidoId?: number; posicionInicio: number; posicionFin: number }) => ({
            tipo: m.tipo as 'CLIENTE' | 'PEDIDO',
            clienteId: m.clienteId ?? null,
            pedidoId: m.pedidoId ?? null,
            posicionInicio: m.posicionInicio,
            posicionFin: m.posicionFin,
          })),
        },
      },
      include: mencionInclude,
    })
    res.status(201).json(tarea)
  } catch {
    res.status(500).json({ error: 'Error al crear tarea' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { texto, fecha, completada, menciones } = req.body
  try {
    if (menciones !== undefined) {
      await prisma.tareaMencion.deleteMany({ where: { tareaId: id } })
    }
    const tarea = await prisma.tarea.update({
      where: { id },
      data: {
        ...(texto !== undefined ? { texto } : {}),
        ...(fecha !== undefined ? { fecha: new Date(fecha) } : {}),
        ...(completada !== undefined ? { completada } : {}),
        ...(menciones !== undefined ? {
          menciones: {
            create: menciones.map((m: { tipo: string; clienteId?: number; pedidoId?: number; posicionInicio: number; posicionFin: number }) => ({
              tipo: m.tipo as 'CLIENTE' | 'PEDIDO',
              clienteId: m.clienteId ?? null,
              pedidoId: m.pedidoId ?? null,
              posicionInicio: m.posicionInicio,
              posicionFin: m.posicionFin,
            })),
          },
        } : {}),
      },
      include: mencionInclude,
    })
    res.json(tarea)
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar tarea' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    await prisma.tarea.delete({ where: { id } })
    res.status(204).send()
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar tarea' })
  }
})

export default router
