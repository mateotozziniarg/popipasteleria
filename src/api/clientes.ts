import client from './client'

export interface Cliente {
  id: number
  nombre: string
  telefono: string | null
  direccion: string | null
  notas: string | null
  createdAt: string
  updatedAt: string
}

export interface ClienteInput {
  nombre: string
  telefono?: string
  direccion?: string
  notas?: string
}

export const getClientes = (search?: string) => {
  const params: Record<string, string> = {}
  if (search) params.search = search
  return client.get<Cliente[]>('/clientes', { params }).then(r => r.data)
}

export const createCliente = (data: ClienteInput) =>
  client.post<Cliente>('/clientes', data).then(r => r.data)

export const updateCliente = (id: number, data: Partial<ClienteInput>) =>
  client.put<Cliente>(`/clientes/${id}`, data).then(r => r.data)

export const deleteCliente = (id: number) => client.delete(`/clientes/${id}`)
