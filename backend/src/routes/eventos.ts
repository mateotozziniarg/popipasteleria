import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

function calcularMetricas(
  pedidos: { precioTotal: any; estadoPago: string }[],
  gastos: { monto: any }[]
) {
  const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)
  const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
  const totalCobrado = pedidos
    .filter(p => p.estadoPago === 'pagado')
    .reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
  return {
    totalGastos,
    totalEsperado,
    totalCobrado,
    gananciaNeta: totalCobrado - totalGastos,
    gananciaEsperada: totalEsperado - totalGastos,
  }
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const eventos = await prisma.evento.findMany({
      orderBy: { fecha: 'asc' },
      include: {
        pedidos: { select: { precioTotal: true, estadoPago: true } },
        gastos: { select: { monto: true } },
      },
    })
    const result = eventos.map(({ pedidos, gastos, ...ev }) => ({
      ...ev,
      ...calcularMetricas(pedidos, gastos),
    }))
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al obtener eventos' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    const ev = await prisma.evento.findUnique({
      where: { id },
      include: {
        pedidos: { select: { precioTotal: true, estadoPago: true } },
        gastos: { select: { monto: true } },
      },
    })
    if (!ev) {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    const { pedidos, gastos, ...rest } = ev
    res.json({ ...rest, ...calcularMetricas(pedidos, gastos) })
  } catch {
    res.status(500).json({ error: 'Error al obtener evento' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, fecha, descripcion } = req.body
  if (!nombre || !fecha) {
    res.status(400).json({ error: 'nombre y fecha son requeridos' })
    return
  }
  try {
    const evento = await prisma.evento.create({
      data: { nombre, fecha: new Date(fecha), descripcion },
    })
    res.status(201).json(evento)
  } catch {
    res.status(500).json({ error: 'Error al crear evento' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { nombre, fecha, descripcion } = req.body
  try {
    const evento = await prisma.evento.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(fecha !== undefined && { fecha: new Date(fecha) }),
        ...(descripcion !== undefined && { descripcion }),
      },
    })
    res.json(evento)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al actualizar evento' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  try {
    await prisma.evento.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    res.status(500).json({ error: 'Error al eliminar evento' })
  }
})

export default router
