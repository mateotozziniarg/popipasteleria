import client from './client'
import type { Tarea } from './tareas'

export interface CalendarioPedido {
  id: number
  nombreCliente: string
  telefono: string | null
  fechaEntrega: string
  estadoEntrega: 'pendiente' | 'entregado'
  estadoPago: 'sin_seña' | 'señado' | 'pagado'
  modalidadEntrega: 'ENVIO' | 'RETIRA' | null
  precioTotal: string
  montoSeña: string | null
  notas: string | null
  descripcion: string | null
  eventoNombre: string | null
  eventoId: number | null
  clienteId: number | null
  productos: { nombre: string; cantidad: number }[]
}

export interface CalendarioData {
  pedidos: CalendarioPedido[]
  tareas: Tarea[]
}

export const getCalendario = (fechaDesde: string, fechaHasta: string) =>
  client.get<CalendarioData>('/calendario', { params: { fechaDesde, fechaHasta } }).then(r => r.data)
