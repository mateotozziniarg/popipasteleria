import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { sendChatMessage, ChatMessage } from '../api/chat'

const TOOL_LABELS: Record<string, string> = {
  listar_pedidos: 'Consultando pedidos...',
  actualizar_pedido: 'Actualizando pedido...',
  listar_eventos: 'Consultando eventos...',
  obtener_evento: 'Cargando evento...',
  buscar_clientes: 'Buscando clientes...',
  obtener_cliente: 'Cargando cliente...',
  listar_productos: 'Consultando catálogo...',
  listar_materias_primas: 'Consultando insumos...',
  listar_gastos: 'Consultando gastos...',
  resumen_financiero: 'Calculando finanzas...',
  listar_propuestas: 'Consultando propuestas...',
  crear_pedido: 'Creando pedido...',
}

const SUGERENCIAS = [
  '¿Qué entrego hoy?',
  '¿Cuánto falta cobrar?',
  '¿Cómo va el mes?',
]

export default function ChatWidget() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeToolLabel, setActiveToolLabel] = useState('Pensando...')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    setActiveToolLabel('Pensando...')

    try {
      const response = await sendChatMessage(newMessages)
      if (response.toolsUsed.length > 0) {
        setActiveToolLabel(TOOL_LABELS[response.toolsUsed[0]] ?? 'Procesando...')
      }
      setMessages(m => [...m, { role: 'model', content: response.reply }])
    } catch {
      setMessages(m => [...m, { role: 'model', content: 'Ocurrió un error. Intentá de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  if (pathname === '/chat') return null

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-[#7A6A5A] rotate-0' : 'bg-[#2A1F1A] hover:bg-[#1A1310]'
        }`}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
      >
        {open
          ? <X size={20} color="white" strokeWidth={2} />
          : <MessageSquare size={19} color="white" strokeWidth={2} />
        }
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-40 right-4 sm:bottom-[4.5rem] sm:right-6 z-40 w-[calc(100vw-2rem)] max-w-[360px] h-[420px] sm:h-[460px] bg-white rounded-2xl shadow-2xl border border-[#E2D9CC] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#2A1F1A] shrink-0">
            <div className="w-7 h-7 rounded-full bg-[#F1E4CC] flex items-center justify-center shrink-0">
              <Sparkles size={13} color="#2A1F1A" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Popibot</p>
              <p className="text-[10px] text-[#B5A28A]">asistente IA · Groq</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[#7A6A5A] hover:text-white text-[10px] transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
              >
                limpiar
              </button>
            )}
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="py-4">
                <p className="text-center text-xs text-[#7A6A5A] mb-4">
                  Hola! Soy Popibot. Puedo consultar eventos, pedidos, clientes y más.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGERENCIAS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-left text-xs text-[#2A1F1A] bg-[#FBF6EC] border border-[#E2D9CC] hover:border-[#B5A28A] hover:bg-[#EBF4FB] px-3 py-2 rounded-xl transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-[#2A1F1A] text-white rounded-tr-sm'
                        : 'bg-[#FBF6EC] text-[#2A1F1A] border border-[#E2D9CC] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#FBF6EC] border border-[#E2D9CC] rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 size={13} className="text-[#B5A28A] animate-spin shrink-0" />
                  <span className="text-xs text-[#7A6A5A]">{activeToolLabel}</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[#E2D9CC] shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                className="flex-1 border border-[#E2D9CC] rounded-xl px-3 py-2 text-sm text-[#2A1F1A] placeholder-[#B5A28A] focus:outline-none focus:ring-2 focus:ring-[#B5A28A] transition-colors"
                placeholder="Escribí un mensaje..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#2A1F1A] hover:bg-[#1A1310] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
              >
                <Send size={14} color="white" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
