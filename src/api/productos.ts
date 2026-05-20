import client from './client'

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precioDefault: string
  createdAt: string
}

export interface PedidoProducto {
  id: number
  pedidoId: number
  productoId: number
  cantidad: number
  precioUnitario: string
  producto: Producto
}

export const getProductos = () =>
  client.get<Producto[]>('/productos').then(r => r.data)

export const createProducto = (data: { nombre: string; descripcion?: string; precioDefault: number }) =>
  client.post<Producto>('/productos', data).then(r => r.data)

export const updateProducto = (id: number, data: Partial<{ nombre: string; descripcion: string; precioDefault: number }>) =>
  client.put<Producto>(`/productos/${id}`, data).then(r => r.data)

export const deleteProducto = (id: number) =>
  client.delete(`/productos/${id}`)

export const getPedidoProductos = (pedidoId: number) =>
  client.get<PedidoProducto[]>(`/pedidos/${pedidoId}/productos`).then(r => r.data)

export const addPedidoProducto = (pedidoId: number, data: { productoId: number; cantidad: number; precioUnitario: number }) =>
  client.post<PedidoProducto>(`/pedidos/${pedidoId}/productos`, data).then(r => r.data)

export const updatePedidoProducto = (pedidoId: number, productoId: number, data: { cantidad?: number; precioUnitario?: number }) =>
  client.put<PedidoProducto>(`/pedidos/${pedidoId}/productos/${productoId}`, data).then(r => r.data)

export const deletePedidoProducto = (pedidoId: number, productoId: number) =>
  client.delete(`/pedidos/${pedidoId}/productos/${productoId}`)
