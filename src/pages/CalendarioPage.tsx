import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, Plus, Check, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { getCalendario, CalendarioPedido, CalendarioData } from '../api/calendario'
import { getTareas, createTarea, updateTarea, Tarea } from '../api/tareas'
import { getClientes } from '../api/clientes'
import { getPedidosGlobal } from '../api/pedidos'
import TextoConMenciones, { MencionInterna, mencionesAInput } from '../components/TextoConMenciones'
import CalendarioItemPopover, { PopoverData } from '../components/CalendarioItemPopover'
import LoadingSpinner from '../components/LoadingSpinner'

// ── helpers ─────────────────────────────────────────────────────────

function getDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysForMonthView(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const dow = firstDay.getDay()
  const daysSinceMon = dow === 0 ? 6 : dow - 1
  const start = new Date(firstDay)
  start.setDate(1 - daysSinceMon)
  const lastDow = lastDay.getDay()
  const daysUntilSun = lastDow === 0 ? 0 : 7 - lastDow
  const end = new Date(lastDay)
  end.setDate(lastDay.getDate() + daysUntilSun)
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
  return days
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay()
  const daysSinceMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(anchor)
  mon.setDate(anchor.getDate() - daysSinceMon)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

const todayStr = getDateStr(new Date())

function groupByDay<T>(items: T[], getDate: (item: T) => string | null): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const d = getDate(item)
    if (!d) continue
    const key = d.substring(0, 10)
    if (!result[key]) result[key] = []
    result[key].push(item)
  }
  return result
}

// ── Tarea modal ──────────────────────────────────────────────────────

export interface TareaModalProps {
  isOpen: boolean
  editTarget: Tarea | null
  defaultFecha: string
  clientes: { id: number; nombre: string; telefono: string | null }[]
  pedidosAutocomplete: { id: number; nombreCliente: string; descripcion: string | null }[]
  onClose: () => void
  onSaved: () => void
}

export function TareaModal({ isOpen, editTarget, defaultFecha, clientes, pedidosAutocomplete, onClose, onSaved }: TareaModalProps) {
  const [fecha, setFecha] = useState(defaultFecha)
  const [texto, setTexto] = useState('')
  const [menciones, setMenciones] = useState<MencionInterna[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFecha(editTarget ? editTarget.fecha.substring(0, 10) : defaultFecha)
    setTexto(editTarget?.texto ?? '')
    setMenciones(editTarget
      ? editTarget.menciones.map(m => ({
          tipo: m.tipo,
          entityId: (m.clienteId ?? m.pedidoId)!,
          display: texto.slice(m.posicionInicio, m.posicionFin),
        }))
      : [])
  }, [isOpen, editTarget, defaultFecha])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !fecha) { toast.error('Fecha y texto son requeridos'); return }
    setSaving(true)
    try {
      const mencionesInput = mencionesAInput(texto, menciones)
      if (editTarget) {
        await updateTarea(editTarget.id, { texto, fecha, menciones: mencionesInput })
        toast.success('Tarea actualizada')
      } else {
        await createTarea({ texto, fecha, menciones: mencionesInput })
        toast.success('Tarea creada')
      }
      onSaved()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#E5EAF1]">
          <h2 className="text-base font-semibold text-[#1F2937]">{editTarget ? 'Editar tarea' : 'Nueva tarea'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Fecha *</label>
            <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Tarea *</label>
            <TextoConMenciones
              value={texto}
              menciones={menciones}
              onChange={(t, m) => { setTexto(t); setMenciones(m) }}
              clientes={clientes}
              pedidos={pedidosAutocomplete}
              placeholder="Describí la tarea..."
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm text-[#6B7280] border border-[#E5EAF1] rounded-xl hover:bg-[#F7FAFC] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
              {saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Day cell item badges ─────────────────────────────────────────────

function PedidoBadge({ pedido, onClick }: { pedido: CalendarioPedido; onClick: (e: React.MouseEvent) => void }) {
  const color = pedido.estadoEntrega === 'entregado'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-800'
  return (
    <button onClick={onClick}
      className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight ${color} hover:brightness-95 transition-all`}>
      {pedido.nombreCliente}
    </button>
  )
}

function TareaBadge({ tarea, onClick }: { tarea: Tarea; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight flex items-center gap-1 transition-all hover:brightness-95 ${tarea.completada ? 'bg-[#F3F4F6] text-[#6B7280] opacity-60' : 'bg-[#F3F4F6] text-[#1F2937]'}`}>
      {tarea.completada && <Check size={9} strokeWidth={3} className="shrink-0" />}
      <span className={tarea.completada ? 'line-through' : ''}>{tarea.texto}</span>
    </button>
  )
}

// ── Day cell ─────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date
  pedidos: CalendarioPedido[]
  tareas: Tarea[]
  isCurrentMonth: boolean
  compact?: boolean
  onClickPedido: (pedido: CalendarioPedido, rect: DOMRect) => void
  onClickTarea: (tarea: Tarea, rect: DOMRect) => void
  onClickDay: (dateStr: string) => void
}

function DayCell({ date, pedidos, tareas, isCurrentMonth, compact = false, onClickPedido, onClickTarea, onClickDay }: DayCellProps) {
  const dateStr = getDateStr(date)
  const isToday = dateStr === todayStr
  const allItems = [...pedidos, ...tareas]
  const maxVisible = compact ? 3 : 4
  const overflow = allItems.length - maxVisible
  const visiblePedidos = pedidos.slice(0, Math.min(pedidos.length, maxVisible))
  const remainingSlots = maxVisible - visiblePedidos.length
  const visibleTareas = tareas.slice(0, remainingSlots)

  return (
    <div
      className={`${compact ? 'min-h-[90px]' : 'min-h-[110px]'} border-b border-r border-[#E5EAF1] p-1.5 flex flex-col gap-0.5 ${!isCurrentMonth ? 'bg-[#FAFBFC]' : 'bg-white'}`}
    >
      <button
        onClick={() => onClickDay(dateStr)}
        className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center mb-0.5 transition-colors ${
          isToday
            ? 'bg-[#9CC6EA] text-white'
            : isCurrentMonth
            ? 'text-[#1F2937] hover:bg-[#F7FAFC]'
            : 'text-[#C4C9D4]'
        }`}
      >
        {date.getDate()}
      </button>
      {visiblePedidos.map(p => (
        <PedidoBadge key={`p-${p.id}`} pedido={p}
          onClick={e => { const t = (e.currentTarget as HTMLElement).getBoundingClientRect(); onClickPedido(p, t) }} />
      ))}
      {visibleTareas.map(t => (
        <TareaBadge key={`t-${t.id}`} tarea={t}
          onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); onClickTarea(t, r) }} />
      ))}
      {overflow > 0 && (
        <p className="text-[10px] text-[#9CC6EA] font-medium px-1">+{overflow} más</p>
      )}
    </div>
  )
}

// ── Week view strip (reusable) ────────────────────────────────────────

export interface WeekViewProps {
  days: Date[]
  pedidosByDay: Record<string, CalendarioPedido[]>
  tareasByDay: Record<string, Tarea[]>
  compact?: boolean
  onClickPedido: (pedido: CalendarioPedido, rect: DOMRect) => void
  onClickTarea: (tarea: Tarea, rect: DOMRect) => void
  onClickDay: (dateStr: string) => void
}

export function WeekView({ days, pedidosByDay, tareasByDay, compact, onClickPedido, onClickTarea, onClickDay }: WeekViewProps) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  return (
    <div className="bg-white border border-[#E5EAF1] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#E5EAF1]">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2 border-r border-[#E5EAF1] last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const key = getDateStr(date)
          return (
            <div key={key} className={i < 6 ? 'border-r border-[#E5EAF1]' : ''}>
              <DayCell
                date={date}
                pedidos={pedidosByDay[key] ?? []}
                tareas={tareasByDay[key] ?? []}
                isCurrentMonth={true}
                compact={compact}
                onClickPedido={onClickPedido}
                onClickTarea={onClickTarea}
                onClickDay={onClickDay}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const navigate = useNavigate()
  const [vista, setVista] = useState<'mes' | 'semana'>('mes')
  const [anchor, setAnchor] = useState(new Date())
  const [data, setData] = useState<CalendarioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<{ id: number; nombre: string; telefono: string | null }[]>([])
  const [pedidosAuto, setPedidosAuto] = useState<{ id: number; nombreCliente: string; descripcion: string | null }[]>([])
  const [popover, setPopover] = useState<PopoverData | null>(null)
  const [tareaModal, setTareaModal] = useState<{ isOpen: boolean; editTarget: Tarea | null; defaultFecha: string }>({
    isOpen: false, editTarget: null, defaultFecha: todayStr,
  })

  const days = vista === 'mes'
    ? getDaysForMonthView(anchor.getFullYear(), anchor.getMonth())
    : getWeekDays(anchor)

  const fechaDesde = getDateStr(days[0])
  const fechaHasta = getDateStr(days[days.length - 1])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await getCalendario(fechaDesde, fechaHasta)
      setData(d)
    } catch { toast.error('Error al cargar calendario') }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getClientes().then(setClientes).catch(() => {})
    getPedidosGlobal({}).then(ps => setPedidosAuto(ps.map(p => ({ id: p.id, nombreCliente: p.nombreCliente, descripcion: p.descripcion })))).catch(() => {})
  }, [])

  function navAnterior() {
    const d = new Date(anchor)
    if (vista === 'mes') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setAnchor(d)
  }

  function navSiguiente() {
    const d = new Date(anchor)
    if (vista === 'mes') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setAnchor(d)
  }

  function navHoy() { setAnchor(new Date()) }

  const titulo = vista === 'mes'
    ? anchor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
    : (() => {
        const start = days[0], end = days[6]
        if (start.getMonth() === end.getMonth())
          return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
        return `${start.getDate()} ${start.toLocaleDateString('es-AR', { month: 'short' })} – ${end.getDate()} ${end.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}`
      })()

  const pedidosByDay = groupByDay(data?.pedidos ?? [], p => p.fechaEntrega)
  const tareasByDay = groupByDay(data?.tareas ?? [], t => t.fecha)

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  function handleClickPedido(pedido: CalendarioPedido, rect: DOMRect) {
    setPopover({ tipo: 'pedido', pedido, rect })
  }

  function handleClickTarea(tarea: Tarea, rect: DOMRect) {
    setPopover({ tipo: 'tarea', tarea, rect })
  }

  function handleClickDay(dateStr: string) {
    setTareaModal({ isOpen: true, editTarget: null, defaultFecha: dateStr })
  }

  function handleEditTarea(tarea: Tarea) {
    setPopover(null)
    setTareaModal({ isOpen: true, editTarget: tarea, defaultFecha: tarea.fecha.substring(0, 10) })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center shrink-0">
          <CalendarDays size={16} color="#1F2937" strokeWidth={2} />
        </div>

        <div className="flex items-center gap-1">
          <button onClick={navAnterior}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7FAFC] text-[#6B7280] transition-colors">
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <h1 className="text-base font-semibold text-[#1F2937] min-w-[160px] text-center">{titulo}</h1>
          <button onClick={navSiguiente}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7FAFC] text-[#6B7280] transition-colors">
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        <button onClick={navHoy}
          className="text-xs font-medium text-[#6B7280] border border-[#E5EAF1] px-3 py-1.5 rounded-lg hover:bg-[#F7FAFC] transition-colors">
          Hoy
        </button>

        {/* Vista toggle */}
        <div className="flex gap-1 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-1">
          <button onClick={() => setVista('mes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${vista === 'mes' ? 'bg-white text-[#1F2937] shadow-sm' : 'text-[#6B7280]'}`}>
            <LayoutGrid size={13} strokeWidth={2} /> Mes
          </button>
          <button onClick={() => setVista('semana')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${vista === 'semana' ? 'bg-white text-[#1F2937] shadow-sm' : 'text-[#6B7280]'}`}>
            <Calendar size={13} strokeWidth={2} /> Semana
          </button>
        </div>

        <button
          onClick={() => setTareaModal({ isOpen: true, editTarget: null, defaultFecha: todayStr })}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium bg-[#1F2937] text-white px-3 py-2 rounded-xl hover:bg-[#374151] transition-colors shrink-0"
        >
          <Plus size={13} strokeWidth={2.5} /> Nueva tarea
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : vista === 'semana' ? (
        <WeekView
          days={days}
          pedidosByDay={pedidosByDay}
          tareasByDay={tareasByDay}
          onClickPedido={handleClickPedido}
          onClickTarea={handleClickTarea}
          onClickDay={handleClickDay}
        />
      ) : (
        /* Vista mes */
        <div className="bg-white border border-[#E5EAF1] rounded-2xl overflow-hidden">
          {/* Headers días */}
          <div className="grid grid-cols-7 border-b border-[#E5EAF1]">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider py-2 border-r border-[#E5EAF1] last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          {/* Grid de días */}
          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              const key = getDateStr(date)
              const isCurrentMonth = date.getMonth() === anchor.getMonth()
              const col = i % 7
              return (
                <div key={key} className={col < 6 ? 'border-r border-[#E5EAF1]' : ''}>
                  <DayCell
                    date={date}
                    pedidos={pedidosByDay[key] ?? []}
                    tareas={tareasByDay[key] ?? []}
                    isCurrentMonth={isCurrentMonth}
                    compact
                    onClickPedido={handleClickPedido}
                    onClickTarea={handleClickTarea}
                    onClickDay={handleClickDay}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CalendarioItemPopover
        data={popover}
        onClose={() => setPopover(null)}
        onUpdated={() => { setPopover(null); load() }}
        onEditTarea={handleEditTarea}
      />

      <TareaModal
        isOpen={tareaModal.isOpen}
        editTarget={tareaModal.editTarget}
        defaultFecha={tareaModal.defaultFecha}
        clientes={clientes}
        pedidosAutocomplete={pedidosAuto}
        onClose={() => setTareaModal(s => ({ ...s, isOpen: false }))}
        onSaved={() => { setTareaModal(s => ({ ...s, isOpen: false })); load() }}
      />
    </div>
  )
}
