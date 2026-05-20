import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router({ mergeParams: true })

router.get('/', async (req: Request, res: Response) => {
  const eventoId = parseInt(req.params.eventoId as string)
  try {
    const gastos = await prisma.eventoGasto.findMany({
      where: { eventoId },
      include: { materiaPrima: true },
      orderBy: { createdAt: 'asc' },
    })
    const result = gastos.map(g => ({
      ...g,
      subtotal: parseFloat(g.cantidad.toString()) * parseFloat(g.precioUnitario.toString()),
    }))
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al obtener gastos' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const eventoId = parseInt(req.params.eventoId as string)
  const { materiaPrimaId, cantidad, precioUnitario, notas } = req.body
  if (!materiaPrimaId || cantidad === undefined || precioUnitario === undefined) {
    res.status(400).json({ error: 'materiaPrimaId, cantidad y precioUnitario son requeridos' })
    return
  }
  try {
    const gasto = await prisma.eventoGasto.create({
      data: { eventoId, materiaPrimaId, cantidad, precioUnitario, notas },
      include: { materiaPrima: true },
    })
    res.status(201).json({
      ...gasto,
      subtotal: parseFloat(gasto.cantidad.toString()) * parseFloat(gasto.precioUnitario.toString()),
    })
  } catch {
    res.status(500).json({ error: 'Error al crear gasto' })
  }
})

router.put('/:gastoId', async (req: Request, res: Response) => {
  const gastoId = parseInt(req.params.gastoId as string)
  const { cantidad, precioUnitario, notas } = req.body
  try {
    const gasto = await prisma.eventoGasto.update({
      where: { id: gastoId },
      data: {
        ...(cantidad !== undefined && { cantidad }),
        ...(precioUnitario !== undefined && { precioUnitario }),
        ...(notas !== undefined && { notas }),
      },
      include: { materiaPrima: true },
    })
    res.json({
      ...gasto,
      subtotal: parseFloat(gasto.cantidad.toString()) * parseFloat(gasto.precioUnitario.toString()),
    })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Gasto no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar gasto' })
  }
})

router.delete('/:gastoId', async (req: Request, res: Response) => {
  const gastoId = parseInt(req.params.gastoId as string)
  try {
    await prisma.eventoGasto.delete({ where: { id: gastoId } })
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
