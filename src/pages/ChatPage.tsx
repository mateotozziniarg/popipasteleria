import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { sendChatMessage, ChatMessage } from '../api/chat'

const TOOL_LABELS: Record<string, string> = {
  listar_eventos: 'Consultando eventos...',
  listar_pedidos: 'Consultando pedidos...',
  buscar_clientes: 'Buscando clientes...',
  listar_productos: 'Buscando productos...',
  obtener_evento: 'Cargando evento...',
  crear_pedido: 'Creando pedido...',
  resumen_financiero: 'Calculando totales...',
}

const SUGERENCIAS = [
  '¿Cuántos eventos hay este mes?',
  '¿Cuánto falta cobrar en total?',
  'Mostrame los pedidos pendientes de entrega',
  '¿Qué productos tengo en el catálogo?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeToolLabel, setActiveToolLabel] = useState('Pensando...')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function autoResize() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

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

  return (
    <div className="flex flex-col h-screen pt-14 bg-[#F7FAFC]">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5EAF1]">
        <div className="w-8 h-8 rounded-full bg-[#1F2937] flex items-center justify-center shrink-0">
          <Sparkles size={14} color="white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2937] leading-tight">Popibot</p>
          <p className="text-[11px] text-[#6B7280]">asistente IA · Groq</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-rose-500 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} strokeWidth={2} />
            Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1F2937] flex items-center justify-center">
                  <Sparkles size={24} color="white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#1F2937]">¡Hola! Soy Popibot</p>
                  <p className="text-sm text-[#6B7280] mt-1 max-w-sm">
                    Puedo consultar eventos, pedidos, clientes y más. También puedo crear pedidos por vos.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGERENCIAS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-left text-sm text-[#1F2937] bg-white border border-[#E5EAF1] hover:border-[#9CC6EA] hover:bg-[#EBF4FB] px-4 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-[#1F2937] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                    <Sparkles size={12} color="white" strokeWidth={2} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-[#1F2937] text-white rounded-tr-sm'
                      : 'bg-white text-[#1F2937] border border-[#E5EAF1] rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-[#1F2937] flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <Sparkles size={12} color="white" strokeWidth={2} />
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                <Loader2 size={14} className="text-[#9CC6EA] animate-spin shrink-0" />
                <span className="text-sm text-[#6B7280]">{activeToolLabel}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-[#E5EAF1] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 border border-[#E5EAF1] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors resize-none overflow-hidden leading-relaxed"
            placeholder="Escribí un mensaje..."
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={loading}
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[#1F2937] hover:bg-[#374151] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0 mb-0.5"
          >
            <Send size={15} color="white" strokeWidth={2} />
          </button>
        </div>
        <p className="max-w-3xl mx-auto text-[10px] text-[#9CC6EA] mt-1.5 text-center">
          Shift+Enter para nueva línea · Enter para enviar
        </p>
      </div>
    </div>
  )
}
