import client from './client'

export interface Gasto {
  id: number
  fecha: string
  eventoId: number | null
  evento: { id: number; nombre: string } | null
  materiaPrimaId: number | null
  materiaPrima: { id: number; nombre: string; precioDefault: string } | null
  cantidad: string | null
  precioUnitario: string | null
  monto: string
  descripcion: string | null
  notas: string | null
  createdAt: string
}

export interface ResumenFinanciero {
  totalIngresosEsperados: number
  totalIngresosCobrados: number
  totalGastos: number
  margenNeto: number
  margenEsperado: number
  cantidadPedidos: number
  cantidadPedidosPendientes: number
  periodoAnterior: {
    totalIngresosEsperados: number
    totalIngresosCobrados: number
    totalGastos: number
    margenNeto: number
    margenEsperado: number
    cantidadPedidos: number
    cantidadPedidosPendientes: number
  }
}

export const getGastos = (filtros: {
  eventoId?: number
  sinEvento?: boolean
  fechaDesde?: string
  fechaHasta?: string
  materiaPrimaId?: number
} = {}) => {
  const params: Record<string, string> = {}
  if (filtros.eventoId) params.eventoId = String(filtros.eventoId)
  if (filtros.sinEvento) params.sinEvento = 'true'
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
  if (filtros.materiaPrimaId) params.materiaPrimaId = String(filtros.materiaPrimaId)
  return client.get<Gasto[]>('/gastos', { params }).then(r => r.data)
}

export const createGasto = (data: {
  fecha: string
  monto: number
  descripcion?: string
  materiaPrimaId?: number | null
  eventoId?: number | null
  notas?: string
}) => client.post<Gasto>('/gastos', data).then(r => r.data)

export const updateGasto = (id: number, data: Partial<{
  fecha: string
  monto: number
  descripcion: string | null
  materiaPrimaId: number | null
  eventoId: number | null
  notas: string | null
}>) => client.put<Gasto>(`/gastos/${id}`, data).then(r => r.data)

export const deleteGasto = (id: number) =>
  client.delete(`/gastos/${id}`)

export const getResumenFinanciero = (fechaDesde: string, fechaHasta: string) =>
  client.get<ResumenFinanciero>('/finanzas/resumen', { params: { fechaDesde, fechaHasta } }).then(r => r.data)
