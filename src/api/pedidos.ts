import client from './client'

export type EstadoEntrega = 'pendiente' | 'entregado'
export type EstadoPago = 'sin_seña' | 'señado' | 'pagado'
export type ModalidadEntrega = 'ENVIO' | 'RETIRA'

export interface PedidoProductoEnPedido {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: string
  producto: { id: number; nombre: string; descripcion: string | null; precioDefault: string }
}

export interface Pedido {
  id: number
  eventoId: number | null
  clienteId: number | null
  cliente: { id: number; nombre: string; telefono: string | null } | null
  nombreCliente: string
  telefono: string | null
  descripcion: string | null
  precioTotal: string
  estadoEntrega: EstadoEntrega
  estadoPago: EstadoPago
  notas: string | null
  montoSeña: string | null
  fechaEntrega: string | null
  modalidadEntrega: ModalidadEntrega | null
  createdAt: string
  productos: PedidoProductoEnPedido[]
}

export interface PedidoInput {
  nombreCliente: string
  telefono?: string
  descripcion?: string
  precioTotal: number
  estadoEntrega?: EstadoEntrega
  estadoPago?: EstadoPago
  notas?: string
  montoSeña?: number | null
  clienteId?: number | null
  eventoId?: number | null
  fechaEntrega?: string | null
  modalidadEntrega?: ModalidadEntrega | null
}

export interface PedidoConEvento extends Pedido {
  evento: { id: number; nombre: string; fecha: string } | null
  cliente: { id: number; nombre: string; telefono: string | null } | null
}

export interface FiltrosPedidos {
  eventoId?: number
  sinEvento?: boolean
  estadoEntrega?: EstadoEntrega
  estadoPago?: EstadoPago
  search?: string
  fechaDesde?: string
  fechaHasta?: string
  filtroPor?: 'creacion' | 'entrega'
  ordenarPor?: 'fechaEntrega'
  sinFecha?: boolean
  modalidadEntrega?: ModalidadEntrega
}

export const getPedidos = (eventoId: number) =>
  client.get<Pedido[]>(`/events/${eventoId}/pedidos`).then(r => r.data)

export const getPedidosGlobal = (filtros: FiltrosPedidos = {}) => {
  const params: Record<string, string> = {}
  if (filtros.eventoId) params.eventoId = String(filtros.eventoId)
  if (filtros.sinEvento) params.sinEvento = 'true'
  if (filtros.estadoEntrega) params.estadoEntrega = filtros.estadoEntrega
  if (filtros.estadoPago) params.estadoPago = filtros.estadoPago
  if (filtros.search) params.search = filtros.search
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
  if (filtros.filtroPor) params.filtroPor = filtros.filtroPor
  if (filtros.ordenarPor) params.ordenarPor = filtros.ordenarPor
  if (filtros.sinFecha) params.sinFecha = 'true'
  if (filtros.modalidadEntrega) params.modalidadEntrega = filtros.modalidadEntrega
  return client.get<PedidoConEvento[]>('/pedidos', { params }).then(r => r.data)
}

export const createPedido = (eventoId: number, data: PedidoInput) =>
  client.post<Pedido>(`/events/${eventoId}/pedidos`, data).then(r => r.data)

export const createPedidoStandalone = (data: PedidoInput) =>
  client.post<Pedido>('/pedidos', data).then(r => r.data)

export const updatePedido = (id: number, data: Partial<PedidoInput>) =>
  client.put<Pedido>(`/pedidos/${id}`, data).then(r => r.data)

export const deletePedido = (id: number) => client.delete(`/pedidos/${id}`)
