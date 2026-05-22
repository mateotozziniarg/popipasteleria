import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

async function calcularResumen(fechaDesde: Date, fechaHasta: Date) {
  const fechaHastaFin = new Date(fechaHasta)
  fechaHastaFin.setHours(23, 59, 59, 999)

  const [pedidos, gastos] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        fechaEntrega: { gte: fechaDesde, lte: fechaHastaFin },
      },
      select: { precioTotal: true, estadoPago: true, estadoEntrega: true },
    }),
    prisma.gasto.findMany({
      where: { fecha: { gte: fechaDesde, lte: fechaHastaFin } },
      select: { monto: true },
    }),
  ])

  const totalIngresosEsperados = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
  const totalIngresosCobrados = pedidos
    .filter(p => p.estadoPago === 'pagado')
    .reduce((s, p) => s + parseFloat(p.precioTotal.toString()), 0)
  const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto.toString()), 0)

  return {
    totalIngresosEsperados,
    totalIngresosCobrados,
    totalGastos,
    margenNeto: totalIngresosCobrados - totalGastos,
    margenEsperado: totalIngresosEsperados - totalGastos,
    cantidadPedidos: pedidos.length,
    cantidadPedidosPendientes: pedidos.filter(p => p.estadoEntrega === 'pendiente').length,
  }
}

router.get('/resumen', async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta } = req.query
  if (!fechaDesde || !fechaHasta) {
    res.status(400).json({ error: 'fechaDesde y fechaHasta son requeridos' })
    return
  }
  try {
    const desde = new Date(fechaDesde as string)
    const hasta = new Date(fechaHasta as string)
    const duracionMs = hasta.getTime() - desde.getTime()

    const anteriorHasta = new Date(desde.getTime() - 1)
    const anteriorDesde = new Date(anteriorHasta.getTime() - duracionMs)

    const [actual, anterior] = await Promise.all([
      calcularResumen(desde, hasta),
      calcularResumen(anteriorDesde, anteriorHasta),
    ])

    res.json({ ...actual, periodoAnterior: anterior })
  } catch {
    res.status(500).json({ error: 'Error al calcular resumen financiero' })
  }
})

export default router
