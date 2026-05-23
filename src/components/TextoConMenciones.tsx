import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hash, AtSign } from 'lucide-react'
import type { Tarea } from '../api/tareas'

export interface MencionInterna {
  tipo: 'CLIENTE' | 'PEDIDO'
  entityId: number
  display: string
}

interface Props {
  value: string
  menciones: MencionInterna[]
  onChange: (text: string, menciones: MencionInterna[]) => void
  clientes: { id: number; nombre: string; telefono: string | null }[]
  pedidos: { id: number; nombreCliente: string; descripcion: string | null }[]
  placeholder?: string
  rows?: number
}

export default function TextoConMenciones({ value, menciones, onChange, clientes, pedidos, placeholder, rows = 3 }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [trigger, setTrigger] = useState<{ char: '@' | '#'; start: number; query: string } | null>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTrigger(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newText = e.target.value
    const cursor = e.target.selectionStart ?? newText.length

    const before = newText.slice(0, cursor)
    const atMatch = before.match(/(?:^|[\s\n])(@[^@#\n]*)$/)
    const hashMatch = before.match(/(?:^|[\s\n])(#[^@#\n]*)$/)

    let newTrigger: typeof trigger = null
    if (atMatch) {
      const rawMatch = atMatch[1]
      const start = before.lastIndexOf(rawMatch)
      newTrigger = { char: '@', start, query: rawMatch.slice(1) }
    } else if (hashMatch) {
      const rawMatch = hashMatch[1]
      const start = before.lastIndexOf(rawMatch)
      newTrigger = { char: '#', start, query: rawMatch.slice(1) }
    }

    const updatedMenciones = menciones.filter(m => newText.includes(m.display))
    setTrigger(newTrigger)
    onChange(newText, updatedMenciones)
  }

  function handleSelect(entity: { id: number; nombre: string }, tipo: 'CLIENTE' | 'PEDIDO') {
    if (!trigger || !textareaRef.current) return
    const display = tipo === 'CLIENTE' ? `@${entity.nombre}` : `#${entity.id} ${entity.nombre}`
    const cursor = textareaRef.current.selectionStart ?? value.length
    const before = value.slice(0, trigger.start)
    const after = value.slice(cursor)
    const newText = before + display + after
    const newMenciones = [...menciones, { tipo, entityId: entity.id, display }]
    setTrigger(null)
    onChange(newText, newMenciones)
    const newCursor = trigger.start + display.length
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = newCursor
        textareaRef.current.selectionEnd = newCursor
      }
    }, 0)
  }

  const clientesSugeridos = trigger?.char === '@'
    ? clientes.filter(c => c.nombre.toLowerCase().includes(trigger.query.toLowerCase())).slice(0, 8)
    : []

  const pedidosSugeridos = trigger?.char === '#'
    ? pedidos.filter(p =>
        p.nombreCliente.toLowerCase().includes(trigger!.query.toLowerCase()) ||
        String(p.id).includes(trigger!.query)
      ).slice(0, 8)
    : []

  const haySugerencias = clientesSugeridos.length > 0 || pedidosSugeridos.length > 0

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={e => { if (e.key === 'Escape') setTrigger(null) }}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] resize-none transition-colors"
      />
      {trigger && haySugerencias && (
        <div ref={dropdownRef} className="absolute z-30 bottom-full mb-1 left-0 right-0 bg-white border border-[#E5EAF1] rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {clientesSugeridos.map(c => (
            <button key={c.id} type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect({ id: c.id, nombre: c.nombre }, 'CLIENTE') }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex items-center gap-2 transition-colors"
            >
              <AtSign size={13} className="text-[#9CC6EA] shrink-0" strokeWidth={2} />
              <span className="text-[#1F2937] font-medium">{c.nombre}</span>
              {c.telefono && <span className="text-[#6B7280] text-xs ml-auto">{c.telefono}</span>}
            </button>
          ))}
          {pedidosSugeridos.map(p => (
            <button key={p.id} type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect({ id: p.id, nombre: p.nombreCliente }, 'PEDIDO') }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex items-center gap-2 transition-colors"
            >
              <Hash size={13} className="text-[#9CC6EA] shrink-0" strokeWidth={2} />
              <span className="text-[#1F2937] font-medium">{p.nombreCliente}</span>
              <span className="text-[#6B7280] text-xs ml-auto">#{p.id}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-[#9CC6EA] mt-1.5">
        Escribí <span className="font-medium">@</span> para mencionar un cliente o <span className="font-medium">#</span> para un pedido
      </p>
    </div>
  )
}

// ── Render read-only de texto con menciones destacadas ──────────────

interface RenderTextoProps {
  tarea: Tarea
  onClickPedido?: (id: number) => void
  className?: string
}

export function RenderTextoConMenciones({ tarea, onClickPedido, className }: RenderTextoProps) {
  const { texto, menciones } = tarea
  const sorted = [...menciones].sort((a, b) => a.posicionInicio - b.posicionInicio)

  const parts: React.ReactNode[] = []
  let lastPos = 0

  for (const m of sorted) {
    if (m.posicionInicio < lastPos) continue
    if (m.posicionInicio > lastPos) {
      parts.push(<span key={`t-${lastPos}`}>{texto.slice(lastPos, m.posicionInicio)}</span>)
    }
    const displayText = texto.slice(m.posicionInicio, m.posicionFin)
    if (m.tipo === 'CLIENTE' && m.cliente) {
      parts.push(
        <Link key={`m-${m.id}`} to={`/clientes/${m.cliente.id}`}
          className="text-[#9CC6EA] font-semibold hover:underline">
          {displayText}
        </Link>
      )
    } else if (m.tipo === 'PEDIDO') {
      parts.push(
        <button key={`m-${m.id}`} type="button"
          onClick={() => onClickPedido?.(m.pedidoId!)}
          className="text-[#9CC6EA] font-semibold hover:underline">
          {displayText}
        </button>
      )
    } else {
      parts.push(<span key={`m-${m.id}`}>{displayText}</span>)
    }
    lastPos = m.posicionFin
  }
  if (lastPos < texto.length) {
    parts.push(<span key="t-end">{texto.slice(lastPos)}</span>)
  }

  return <span className={className}>{parts}</span>
}

// ── Helpers para convertir MencionInterna → MencionInput al guardar ─

export function mencionesAInput(texto: string, menciones: MencionInterna[]) {
  return menciones
    .map(m => {
      const idx = texto.indexOf(m.display)
      if (idx === -1) return null
      return {
        tipo: m.tipo,
        clienteId: m.tipo === 'CLIENTE' ? m.entityId : undefined,
        pedidoId: m.tipo === 'PEDIDO' ? m.entityId : undefined,
        posicionInicio: idx,
        posicionFin: idx + m.display.length,
      }
    })
    .filter(Boolean) as { tipo: 'CLIENTE' | 'PEDIDO'; clienteId?: number; pedidoId?: number; posicionInicio: number; posicionFin: number }[]
}
