import client from './client'

export type EstadoPropuesta = 'BORRADOR' | 'PRESENTADA' | 'CONFIRMADA'
export type CategoriaIdea = 'RELLENO' | 'DECORACION' | 'PACKAGING' | 'PRECIO' | 'OTRO'

export interface PropuestaProducto {
  id: number
  propuestaId: number
  nombre: string
  descripcion: string | null
  precio: string | null
  notas: string | null
}

export interface ComboProducto {
  id: number
  cantidad: number
  propuestaProductoId: number
  producto: PropuestaProducto
}

export interface PropuestaCombo {
  id: number
  propuestaId: number
  nombre: string
  descripcion: string | null
  precioCombo: string | null
  productos: ComboProducto[]
}

export interface PropuestaIdea {
  id: number
  propuestaId: number
  texto: string
  categoria: CategoriaIdea
}

export interface PropuestaListItem {
  id: number
  nombre: string
  tematica: string | null
  estado: EstadoPropuesta
  eventoId: number | null
  createdAt: string
  updatedAt: string
  _count: { productos: number; combos: number; ideas: number }
}

export interface PropuestaDetalle {
  id: number
  nombre: string
  tematica: string | null
  descripcion: string | null
  estado: EstadoPropuesta
  eventoId: number | null
  createdAt: string
  updatedAt: string
  productos: PropuestaProducto[]
  combos: PropuestaCombo[]
  ideas: PropuestaIdea[]
}

export interface IASugerencias {
  productosNuevos: { nombre: string; descripcion: string; precioSugerido: number; notas: string }[]
  nombresCombo: { comboId: number; nombresSugeridos: string[] }[]
  descripcionesProducto: { productoId: number; descripcion: string }[]
  ideasGenerales: { texto: string; categoria: CategoriaIdea }[]
}

export const getPropuestas = () =>
  client.get<PropuestaListItem[]>('/propuestas').then(r => r.data)

export const getPropuesta = (id: number) =>
  client.get<PropuestaDetalle>(`/propuestas/${id}`).then(r => r.data)

export const createPropuesta = (data: { nombre: string; tematica?: string }) =>
  client.post<PropuestaListItem>('/propuestas', data).then(r => r.data)

export const updatePropuesta = (id: number, data: Partial<{ nombre: string; tematica: string; descripcion: string; estado: EstadoPropuesta }>) =>
  client.put<PropuestaDetalle>(`/propuestas/${id}`, data).then(r => r.data)

export const deletePropuesta = (id: number) =>
  client.delete(`/propuestas/${id}`)

export const addProducto = (propuestaId: number, data: { nombre: string; descripcion?: string; precio?: string; notas?: string }) =>
  client.post<PropuestaProducto>(`/propuestas/${propuestaId}/productos`, data).then(r => r.data)

export const updateProducto = (propuestaId: number, productoId: number, data: Partial<{ nombre: string; descripcion: string; precio: string | null; notas: string }>) =>
  client.put<PropuestaProducto>(`/propuestas/${propuestaId}/productos/${productoId}`, data).then(r => r.data)

export const deleteProducto = (propuestaId: number, productoId: number) =>
  client.delete(`/propuestas/${propuestaId}/productos/${productoId}`)

export const addCombo = (propuestaId: number, data: { nombre: string; descripcion?: string; precioCombo?: string; productos?: { propuestaProductoId: number; cantidad: number }[] }) =>
  client.post<PropuestaCombo>(`/propuestas/${propuestaId}/combos`, data).then(r => r.data)

export const updateCombo = (propuestaId: number, comboId: number, data: Partial<{ nombre: string; descripcion: string; precioCombo: string | null; productos: { propuestaProductoId: number; cantidad: number }[] }>) =>
  client.put<PropuestaCombo>(`/propuestas/${propuestaId}/combos/${comboId}`, data).then(r => r.data)

export const deleteCombo = (propuestaId: number, comboId: number) =>
  client.delete(`/propuestas/${propuestaId}/combos/${comboId}`)

export const addIdea = (propuestaId: number, data: { texto: string; categoria: CategoriaIdea }) =>
  client.post<PropuestaIdea>(`/propuestas/${propuestaId}/ideas`, data).then(r => r.data)

export const deleteIdea = (propuestaId: number, ideaId: number) =>
  client.delete(`/propuestas/${propuestaId}/ideas/${ideaId}`)

export const convertirPropuesta = (propuestaId: number, fecha: string) =>
  client.post(`/propuestas/${propuestaId}/convertir`, { fecha }).then(r => r.data)

export const generarIdeas = (propuestaId: number) =>
  client.post<IASugerencias>(`/propuestas/${propuestaId}/generar`).then(r => r.data)
