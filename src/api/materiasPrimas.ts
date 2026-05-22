import client from './client'

export interface MateriaPrima {
  id: number
  nombre: string
  descripcion: string | null
  precioDefault: string
  createdAt: string
}

export interface EventoGasto {
  id: number
  eventoId: number
  materiaPrimaId: number
  cantidad: string
  precioUnitario: string
  notas: string | null
  createdAt: string
  materiaPrima: MateriaPrima
  subtotal: number
}

export const getMateriasPrimas = () =>
  client.get<MateriaPrima[]>('/materias-primas').then(r => r.data)

export const createMateriaPrima = (data: { nombre: string; descripcion?: string; precioDefault: number }) =>
  client.post<MateriaPrima>('/materias-primas', data).then(r => r.data)

export const updateMateriaPrima = (id: number, data: Partial<{ nombre: string; descripcion: string; precioDefault: number }>) =>
  client.put<MateriaPrima>(`/materias-primas/${id}`, data).then(r => r.data)

export const deleteMateriaPrima = (id: number) =>
  client.delete(`/materias-primas/${id}`)

export const getEventoGastos = (eventoId: number) =>
  client.get<EventoGasto[]>(`/events/${eventoId}/gastos`).then(r => r.data)

export const createEventoGasto = (
  eventoId: number,
  data: { materiaPrimaId: number; cantidad: number; precioUnitario: number; notas?: string }
) => client.post<EventoGasto>(`/events/${eventoId}/gastos`, data).then(r => r.data)

export const updateEventoGasto = (
  eventoId: number,
  gastoId: number,
  data: { cantidad?: number; precioUnitario?: number; notas?: string }
) => client.put<EventoGasto>(`/events/${eventoId}/gastos/${gastoId}`, data).then(r => r.data)

export const deleteEventoGasto = (eventoId: number, gastoId: number) =>
  client.delete(`/events/${eventoId}/gastos/${gastoId}`)

export const getGastosTotal = async (filtros: { eventoId?: number; fechaDesde?: string; fechaHasta?: string } = {}) => {
  const params: Record<string, string> = {}
  if (filtros.eventoId) params.eventoId = String(filtros.eventoId)
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
  const gastos = await client.get<{ monto: string }[]>('/gastos', { params }).then(r => r.data)
  return gastos.reduce((s, g) => s + parseFloat(g.monto), 0)
}
