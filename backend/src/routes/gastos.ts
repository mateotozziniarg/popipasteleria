import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { eventoId, sinEvento, fechaDesde, fechaHasta, materiaPrimaId } = req.query
  try {
    const gastos = await prisma.gasto.findMany({
      where: {
        ...(eventoId ? { eventoId: parseInt(eventoId as string) } : {}),
        ...(sinEvento === 'true' ? { eventoId: null } : {}),
        ...(materiaPrimaId ? { materiaPrimaId: parseInt(materiaPrimaId as string) } : {}),
        ...(fechaDesde || fechaHasta ? {
          fecha: {
            ...(fechaDesde ? { gte: new Date(fechaDesde as string) } : {}),
            ...(fechaHasta ? { lte: new Date(new Date(fechaHasta as string).setHours(23, 59, 59, 999)) } : {}),
          },
        } : {}),
      },
      include: {
        materiaPrima: true,
        evento: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: 'desc' },
    })
    res.json(gastos)
  } catch {
    res.status(500).json({ error: 'Error al obtener gastos' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { fecha, monto, descripcion, materiaPrimaId, eventoId, notas } = req.body
  if (!fecha || monto === undefined) {
    res.status(400).json({ error: 'fecha y monto son requeridos' })
    return
  }
  try {
    const gasto = await prisma.gasto.create({
      data: {
        fecha: new Date(fecha),
        monto,
        descripcion: descripcion ?? null,
        materiaPrimaId: materiaPrimaId ?? null,
        eventoId: eventoId ?? null,
        notas: notas ?? null,
      },
      include: {
        materiaPrima: true,
        evento: { select: { id: true, nombre: true } },
      },
    })
    res.status(201).json(gasto)
  } catch {
    res.status(500).json({ error: 'Error al crear gasto' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { fecha, monto, descripcion, materiaPrimaId, eventoId, notas } = req.body
  try {
    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
        ...(monto !== undefined && { monto }),
        ...(descripcion !== undefined && { descripcion }),
        ...(materiaPrimaId !== undefined && { materiaPrimaId: materiaPrimaId ?? null }),
        ...(eventoId !== undefined && { eventoId: eventoId ?? null }),
        ...(notas !== undefined && { notas }),
      },
      include: {
        materiaPrima: true,
        evento: { select: { id: true, nombre: true } },
      },
    })
    res.json(gasto)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Gasto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar gasto' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    await prisma.gasto.delete({ where: { id: id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Gasto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar gasto' })
  }
})

export default router
