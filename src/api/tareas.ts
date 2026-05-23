import client from './client'

export type TipoMencion = 'CLIENTE' | 'PEDIDO'

export interface TareaMencionResuelto {
  id: number
  tipo: TipoMencion
  clienteId: number | null
  cliente: { id: number; nombre: string; telefono?: string | null } | null
  pedidoId: number | null
  pedido: { id: number; nombreCliente: string; descripcion: string | null } | null
  posicionInicio: number
  posicionFin: number
}

export interface Tarea {
  id: number
  texto: string
  fecha: string
  completada: boolean
  createdAt: string
  updatedAt: string
  menciones: TareaMencionResuelto[]
}

export interface MencionInput {
  tipo: TipoMencion
  clienteId?: number | null
  pedidoId?: number | null
  posicionInicio: number
  posicionFin: number
}

export const getTareas = (filtros: { fechaDesde?: string; fechaHasta?: string; completada?: boolean } = {}) => {
  const params: Record<string, string> = {}
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
  if (filtros.completada !== undefined) params.completada = String(filtros.completada)
  return client.get<Tarea[]>('/tareas', { params }).then(r => r.data)
}

export const createTarea = (data: { texto: string; fecha: string; menciones?: MencionInput[] }) =>
  client.post<Tarea>('/tareas', data).then(r => r.data)

export const updateTarea = (id: number, data: { texto?: string; fecha?: string; completada?: boolean; menciones?: MencionInput[] }) =>
  client.put<Tarea>(`/tareas/${id}`, data).then(r => r.data)

export const deleteTarea = (id: number) =>
  client.delete(`/tareas/${id}`)
