import client from './client'

export type EstadoEntrega = 'pendiente' | 'entregado'
export type EstadoPago = 'sin_seña' | 'señado' | 'pagado'

export interface PedidoProductoEnPedido {
  id: number
  productoId: number
  cantidad: number
  precioUnitario: string
  producto: { id: number; nombre: string; descripcion: string | null; precioDefault: string }
}

export interface Pedido {
  id: number
  eventoId: number
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
}

export interface PedidoConEvento extends Pedido {
  evento: { id: number; nombre: string; fecha: string }
  cliente: { id: number; nombre: string; telefono: string | null } | null
}

export interface FiltrosPedidos {
  eventoId?: number
  estadoEntrega?: EstadoEntrega
  estadoPago?: EstadoPago
  fechaDesde?: string
  fechaHasta?: string
}

export const getPedidos = (eventoId: number) =>
  client.get<Pedido[]>(`/events/${eventoId}/pedidos`).then(r => r.data)

export const getPedidosGlobal = (filtros: FiltrosPedidos = {}) => {
  const params: Record<string, string> = {}
  if (filtros.eventoId) params.eventoId = String(filtros.eventoId)
  if (filtros.estadoEntrega) params.estadoEntrega = filtros.estadoEntrega
  if (filtros.estadoPago) params.estadoPago = filtros.estadoPago
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
  return client.get<PedidoConEvento[]>('/pedidos', { params }).then(r => r.data)
}

export const createPedido = (eventoId: number, data: PedidoInput) =>
  client.post<Pedido>(`/events/${eventoId}/pedidos`, data).then(r => r.data)

export const updatePedido = (id: number, data: Partial<PedidoInput>) =>
  client.put<Pedido>(`/pedidos/${id}`, data).then(r => r.data)

export const deletePedido = (id: number) => client.delete(`/pedidos/${id}`)
