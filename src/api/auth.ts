import client from './client'

export const login = (email: string, password: string) =>
  client.post<{ token: string; user: { id: number; email: string; nombre: string | null } }>(
    '/auth/login',
    { email, password }
  ).then(r => r.data)

export const logoutApi = () => client.post('/auth/logout')
