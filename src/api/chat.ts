import client from './client'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface ChatResponse {
  reply: string
  toolsUsed: string[]
}

export const sendChatMessage = (messages: ChatMessage[]) =>
  client.post<ChatResponse>('/chat', { messages }).then(r => r.data)
