import client from './client'

export interface Evento {
  id: number
  nombre: string
  fecha: string
  descripcion: string | null
  createdAt: string
}

export interface EventoConResumen extends Evento {
  totalPedidos: number
  montoTotal: number
}

export const getEventos = () => client.get<Evento[]>('/events').then(r => r.data)

export const createEvento = (data: { nombre: string; fecha: string; descripcion?: string }) =>
  client.post<Evento>('/events', data).then(r => r.data)

export const updateEvento = (id: number, data: Partial<{ nombre: string; fecha: string; descripcion: string }>) =>
  client.put<Evento>(`/events/${id}`, data).then(r => r.data)

export const deleteEvento = (id: number) => client.delete(`/events/${id}`)
