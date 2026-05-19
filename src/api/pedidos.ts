import client from './client'

export type EstadoEntrega = 'pendiente' | 'entregado'
export type EstadoPago = 'sin_seña' | 'señado' | 'pagado'

export interface Pedido {
  id: number
  eventoId: number
  nombreCliente: string
  telefono: string | null
  descripcion: string
  precioTotal: string
  estadoEntrega: EstadoEntrega
  estadoPago: EstadoPago
  notas: string | null
  createdAt: string
}

export interface PedidoInput {
  nombreCliente: string
  telefono?: string
  descripcion: string
  precioTotal: number
  estadoEntrega?: EstadoEntrega
  estadoPago?: EstadoPago
  notas?: string
}

export const getPedidos = (eventoId: number) =>
  client.get<Pedido[]>(`/events/${eventoId}/pedidos`).then(r => r.data)

export const createPedido = (eventoId: number, data: PedidoInput) =>
  client.post<Pedido>(`/events/${eventoId}/pedidos`, data).then(r => r.data)

export const updatePedido = (id: number, data: Partial<PedidoInput>) =>
  client.put<Pedido>(`/pedidos/${id}`, data).then(r => r.data)

export const deletePedido = (id: number) => client.delete(`/pedidos/${id}`)
