import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Pencil, Trash2, ShoppingCart, Truck, DollarSign, CreditCard,
  FlaskConical, TrendingUp, TrendingDown, Calendar
} from 'lucide-react'
import { Evento, getEventos } from '../api/eventos'
import { Pedido, EstadoEntrega, EstadoPago, getPedidos, deletePedido } from '../api/pedidos'
import {
  MateriaPrima, EventoGasto,
  getMateriasPrimas, createMateriaPrima,
  getEventoGastos, createEventoGasto, updateEventoGasto, deleteEventoGasto
} from '../api/materiasPrimas'
import LoadingSpinner from '../components/LoadingSpinner'
import PedidoFormModal from '../components/PedidoFormModal'
import ConfirmModal from '../components/ConfirmModal'

const etiquetaEntrega: Record<EstadoEntrega, string> = { pendiente: 'Pendiente', entregado: 'Entregado' }
const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Pendiente', señado: 'Señado', pagado: 'Pagado' }

const badgeEntrega = (e: EstadoEntrega) =>
  e === 'entregado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

const badgePago = (e: EstadoPago) =>
  e === 'pagado'
    ? 'bg-emerald-50 text-emerald-700'
    : e === 'señado'
    ? 'bg-[#CFE6F7] text-[#1F2937]'
    : 'bg-rose-50 text-rose-600'

const formatMonto = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatFechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const esFechaPasada = (iso: string) => iso.substring(0, 10) < getTodayStr()

const inputInline = 'border border-[#E5EAF1] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'

// ── Buscador de materias primas ────────────────────────────────────
interface BuscadorMpProps {
  materias: MateriaPrima[]
  gastosActuales: EventoGasto[]
  onAgregar: (mp: MateriaPrima) => void
  onCrearYAgregar: (nombre: string) => void
}

function BuscadorMateriaPrima({ materias, gastosActuales, onAgregar, onCrearYAgregar }: BuscadorMpProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        if (!query) setActive(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query])

  const idsActuales = new Set(gastosActuales.map(g => g.materiaPrimaId))
  const filtradas = materias.filter(m => !idsActuales.has(m.id) && m.nombre.toLowerCase().includes(query.toLowerCase()))
  const mostrarCrear = query.trim().length > 0 && !materias.some(m => m.nombre.toLowerCase() === query.toLowerCase())

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#9CC6EA] border-2 border-dashed border-[#9CC6EA] rounded-xl hover:bg-[#F7FAFC] hover:text-[#6BAFD4] transition-colors"
      >
        <Plus size={16} strokeWidth={2.5} />
        Agregar materia prima
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        className="w-full border-2 border-[#9CC6EA] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none transition-colors"
        placeholder="Buscar materia prima..."
        value={query} onChange={e => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
      />
      {open && (filtradas.length > 0 || mostrarCrear) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtradas.map(m => (
            <button key={m.id} type="button"
              onClick={() => { onAgregar(m); setQuery(''); setOpen(false); setActive(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{m.nombre}</span>
              <span className="text-[#6B7280] text-xs">{formatMonto(parseFloat(m.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button type="button"
              onClick={() => { onCrearYAgregar(query.trim()); setQuery(''); setOpen(false); setActive(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} /> Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form crear materia prima inline ─────────────────────────
function MiniCrearMateriaPrima({ nombre, onConfirmar, onCancelar }: { nombre: string; onConfirmar: (mp: MateriaPrima) => void; onCancelar: () => void }) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!precio) return
    setSaving(true)
    try { onConfirmar(await createMateriaPrima({ nombre, precioDefault: parseFloat(precio) })) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2">
      <p className="text-sm font-medium text-[#1F2937] mb-2.5">Crear materia prima "{nombre}"</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[#6B7280] mb-1">Precio por defecto</label>
          <input type="number" min="0" step="0.01" autoFocus placeholder="0"
            className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
            value={precio} onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrear() } }}
          />
        </div>
        <button type="button" disabled={saving || !precio} onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">Cancelar</button>
      </div>
    </div>
  )
}

// ── Fila de gasto (inline editable) ───────────────────────────────
interface GastoRowProps {
  gasto: EventoGasto
  eventoId: number
  onDelete: () => void
  onUpdate: (g: EventoGasto) => void
}

function GastoRow({ gasto, eventoId, onDelete, onUpdate }: GastoRowProps) {
  const [cantidad, setCantidad] = useState(gasto.cantidad)
  const [precio, setPrecio] = useState(gasto.precioUnitario)
  const [notas, setNotas] = useState(gasto.notas ?? '')

  async function save() {
    try {
      const updated = await updateEventoGasto(eventoId, gasto.id, {
        cantidad: parseFloat(cantidad) || 0,
        precioUnitario: parseFloat(precio) || 0,
        notas: notas || undefined,
      })
      onUpdate(updated)
      toast.success('Guardado')
    } catch {
      toast.error('Error al guardar')
    }
  }

  const subtotal = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0)
  const cellInput = 'border border-[#E5EAF1] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white'

  return (
    <tr className="border-b border-[#E5EAF1] hover:bg-[#FAFBFC] transition-colors group">
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-[#1F2937]">{gasto.materiaPrima.nombre}</span>
      </td>
      <td className="px-3 py-3">
        <input type="number" min="0" step="0.01" title="Cantidad"
          className={`w-14 text-center ${cellInput}`}
          value={cantidad} onChange={e => setCantidad(e.target.value)} onBlur={save}
        />
      </td>
      <td className="px-3 py-3">
        <input type="number" min="0" step="0.01" title="Precio unitario"
          className={`w-24 text-right ${cellInput}`}
          value={precio} onChange={e => setPrecio(e.target.value)} onBlur={save}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <span className="text-sm font-bold text-[#1F2937] whitespace-nowrap">{formatMonto(subtotal)}</span>
      </td>
      <td className="px-3 py-3">
        <input className={`w-full text-xs ${cellInput}`}
          value={notas} onChange={e => setNotas(e.target.value)} onBlur={save} placeholder="Notas..."
        />
      </td>
      <td className="px-3 py-3 text-xs text-[#6B7280] whitespace-nowrap hidden sm:table-cell">
        {formatFecha(gasto.createdAt)}
      </td>
      <td className="px-4 py-3">
        <button onClick={onDelete} className="text-[#9CC6EA] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </td>
    </tr>
  )
}

// ── Página principal ───────────────────────────────────────────────
export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  const eventoId = parseInt(id!)
  const navigate = useNavigate()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [gastos, setGastos] = useState<EventoGasto[]>([])
  const [materias, setMaterias] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pedido | null>(null)
  const [crearMpNombre, setCrearMpNombre] = useState<string | null>(null)
  const [addingGasto, setAddingGasto] = useState(false)
  const [confirmPedidoId, setConfirmPedidoId] = useState<number | null>(null)
  const [confirmGastoId, setConfirmGastoId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [evs, peds, gsts, mats] = await Promise.all([
        getEventos(),
        getPedidos(eventoId),
        getEventoGastos(eventoId),
        getMateriasPrimas(),
      ])
      setEvento(evs.find(e => e.id === eventoId) ?? null)
      setPedidos(peds)
      setGastos(gsts)
      setMaterias(mats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [eventoId])

  function openCreate() { setEditTarget(null); setModalOpen(true) }
  function openEdit(p: Pedido) { setEditTarget(p); setModalOpen(true) }

  async function execDeletePedido() {
    if (!confirmPedidoId) return
    setDeleting(true)
    try {
      await deletePedido(confirmPedidoId)
      setConfirmPedidoId(null)
      load()
    } finally { setDeleting(false) }
  }

  async function handleAgregarGasto(mp: MateriaPrima) {
    setAddingGasto(true)
    try {
      const gasto = await createEventoGasto(eventoId, { materiaPrimaId: mp.id, cantidad: 1, precioUnitario: parseFloat(mp.precioDefault) })
      setGastos(prev => [...prev, gasto])
    } finally { setAddingGasto(false) }
  }

  async function execDeleteGasto() {
    if (!confirmGastoId) return
    setDeleting(true)
    try {
      await deleteEventoGasto(eventoId, confirmGastoId)
      setGastos(prev => prev.filter(g => g.id !== confirmGastoId))
      setConfirmGastoId(null)
    } finally { setDeleting(false) }
  }

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    if (a.estadoEntrega !== b.estadoEntrega) return a.estadoEntrega === 'pendiente' ? -1 : 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const totalCobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const totalSenas = pedidos.filter(p => p.estadoPago === 'señado' && p.montoSeña).reduce((s, p) => s + parseFloat(p.montoSeña!), 0)
  const totalRecibido = totalCobrado + totalSenas
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pagados = pedidos.filter(p => p.estadoPago === 'pagado').length
  const totalGastos = gastos.reduce((s, g) => s + g.subtotal, 0)
  const gananciaNeta = totalRecibido - totalGastos
  const gananciaEsperada = totalEsperado - totalGastos

  if (loading) return <LoadingSpinner fullscreen />
  if (!evento) return <p className="p-6 text-sm text-red-500">Evento no encontrado.</p>

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <button onClick={() => navigate('/eventos')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] mb-5 transition-colors">
        <ArrowLeft size={14} strokeWidth={2} /> Eventos
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1F2937]">{evento.nombre}</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Calendar size={13} color="#9CC6EA" strokeWidth={2} />
          <p className="text-sm text-[#6B7280]">{formatFecha(evento.fecha)}</p>
        </div>
        {evento.descripcion && <p className="text-sm text-[#6B7280] mt-1">{evento.descripcion}</p>}
      </div>

      {/* Fila 1 — Ingresos */}
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Ingresos</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2"><ShoppingCart size={13} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Pedidos</p></div>
          <p className="text-2xl font-semibold text-[#1F2937]">{pedidos.length}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2"><Truck size={13} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Entregados</p></div>
          <p className="text-2xl font-semibold text-[#1F2937]">{entregados}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2"><DollarSign size={13} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Total esperado</p></div>
          <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalEsperado)}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2"><CreditCard size={13} color="#10b981" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Recibido</p></div>
          <p className="text-lg font-semibold text-emerald-600">{formatMonto(totalRecibido)}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">{pagados} pagados{totalSenas > 0 ? ` + ${formatMonto(totalSenas)} señas` : ''}</p>
        </div>
      </div>

      {/* Fila 2 — Rentabilidad */}
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Rentabilidad</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2"><FlaskConical size={13} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Total gastos</p></div>
          <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalGastos)}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {gananciaNeta >= 0 ? <TrendingUp size={13} color="#10b981" strokeWidth={2} /> : <TrendingDown size={13} color="#ef4444" strokeWidth={2} />}
            <p className="text-xs text-[#6B7280]">Ganancia neta</p>
          </div>
          <p className={`text-lg font-semibold ${gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatMonto(gananciaNeta)}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">recibido − gastos</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {gananciaEsperada >= 0 ? <TrendingUp size={13} color="#9CC6EA" strokeWidth={2} /> : <TrendingDown size={13} color="#f59e0b" strokeWidth={2} />}
            <p className="text-xs text-[#6B7280]">Ganancia esperada</p>
          </div>
          <p className={`text-lg font-semibold ${gananciaEsperada >= 0 ? 'text-[#1F2937]' : 'text-amber-500'}`}>{formatMonto(gananciaEsperada)}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">total − gastos</p>
        </div>
      </div>

      {/* Sección gastos */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl mb-6">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#E5EAF1]">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center shrink-0">
            <FlaskConical size={15} color="#1F2937" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1F2937]">Gastos del evento</h3>
            <p className="text-xs text-[#6B7280]">Registrá todos los gastos asociados a este evento.</p>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5EAF1] bg-[#F7FAFC]">
                <th className="text-left text-xs font-medium text-[#6B7280] px-3 py-3">Materia prima</th>
                <th className="text-center text-xs font-medium text-[#6B7280] px-3 py-3">Cantidad</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-3 py-3">Precio unit.</th>
                <th className="text-right text-xs font-medium text-[#6B7280] px-3 py-3">Total</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-3 py-3">Notas</th>
                <th className="text-left text-xs font-medium text-[#6B7280] px-3 py-3 hidden sm:table-cell">Fecha</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {gastos.map(g => (
                <GastoRow key={g.id} gasto={g} eventoId={eventoId}
                  onDelete={() => setConfirmGastoId(g.id)}
                  onUpdate={updated => setGastos(prev => prev.map(x => x.id === updated.id ? updated : x))}
                />
              ))}
            </tbody>
          </table>
        </div>

        {gastos.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center px-5 py-8">No hay gastos registrados para este evento.</p>
        )}

        {/* Agregar */}
        <div className="border-t border-dashed border-[#9CC6EA] px-4 py-3">
          {crearMpNombre ? (
            <MiniCrearMateriaPrima nombre={crearMpNombre}
              onConfirmar={mp => { setMaterias(prev => [...prev, mp].sort((a, b) => a.nombre.localeCompare(b.nombre))); handleAgregarGasto(mp); setCrearMpNombre(null) }}
              onCancelar={() => setCrearMpNombre(null)}
            />
          ) : (
            <BuscadorMateriaPrima materias={materias} gastosActuales={gastos}
              onAgregar={handleAgregarGasto} onCrearYAgregar={nombre => setCrearMpNombre(nombre)}
            />
          )}
          {addingGasto && <p className="text-xs text-[#6B7280] mt-1">Agregando...</p>}
        </div>

        {/* Footer total */}
        {gastos.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#E5EAF1]">
            <span className="text-sm text-[#6B7280]">Total de gastos</span>
            <span className="text-base font-bold text-[#1F2937]">{formatMonto(totalGastos)}</span>
          </div>
        )}
      </div>



      {/* Encabezado pedidos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#1F2937] flex items-center gap-2">
          <ShoppingCart size={15} color="#9CC6EA" strokeWidth={2} /> Pedidos
        </h2>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} /> Nuevo pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280]">
          <ShoppingCart size={28} className="mx-auto mb-3 text-[#E5EAF1]" strokeWidth={1.5} />
          <p className="text-sm">No hay pedidos para este evento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pedidosOrdenados.map((p) => {
            const precio = parseFloat(p.precioTotal)
            const sena = p.montoSeña ? parseFloat(p.montoSeña) : null
            const resta = sena !== null ? precio - sena : null
            return (
              <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl px-5 py-4 hover:border-[#9CC6EA] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1F2937]">{p.nombreCliente}</p>
                      {p.modalidadEntrega && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.modalidadEntrega === 'ENVIO' ? 'bg-[#CFE6F7] text-[#1F2937]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {p.modalidadEntrega === 'ENVIO' ? 'Envío' : 'Retira'}
                        </span>
                      )}
                    </div>
                    {(p.cliente?.telefono || p.telefono) && (
                      <a href={`tel:${p.cliente?.telefono ?? p.telefono}`}
                        className="text-xs text-[#6B7280] hover:text-[#1F2937] mt-0.5 block transition-colors"
                        onClick={e => e.stopPropagation()}>
                        {p.cliente?.telefono ?? p.telefono}
                      </a>
                    )}
                    {p.fechaEntrega && (
                      <p className={`text-xs mt-0.5 font-medium ${esFechaPasada(p.fechaEntrega) && p.estadoEntrega === 'pendiente' ? 'text-red-500' : 'text-[#6B7280]'}`}>
                        Entrega: {formatFechaCorta(p.fechaEntrega)}
                      </p>
                    )}
                    {p.productos.length > 0 ? (
                      <p className="text-sm text-[#6B7280] mt-1.5">{p.productos.map(pp => `${pp.producto.nombre} × ${pp.cantidad}`).join(' — ')}</p>
                    ) : p.descripcion ? (
                      <p className="text-sm text-[#6B7280] mt-1.5">{p.descripcion}</p>
                    ) : null}
                    {p.notas && <p className="text-xs text-[#6B7280] mt-1 italic">{p.notas}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#1F2937]">{formatMonto(precio)}</p>
                    {sena !== null && resta !== null && (
                      <div className="mt-0.5">
                        <p className="text-xs text-[#6B7280]">Seña: {formatMonto(sena)}</p>
                        <p className="text-xs font-medium text-amber-600">Resta: {formatMonto(resta)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5EAF1]">
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeEntrega(p.estadoEntrega)}`}>{etiquetaEntrega[p.estadoEntrega]}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgePago(p.estadoPago)}`}>{etiquetaPago[p.estadoPago]}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors px-2 py-1 rounded-lg hover:bg-[#F7FAFC]">
                      <Pencil size={11} strokeWidth={2} /> Editar
                    </button>
                    <button onClick={() => setConfirmPedidoId(p.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                      <Trash2 size={11} strokeWidth={2} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmPedidoId !== null}
        titulo="¿Eliminar este pedido?"
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Borrar pedido"
        onConfirmar={execDeletePedido}
        onCancelar={() => setConfirmPedidoId(null)}
        loading={deleting}
      />

      <ConfirmModal
        isOpen={confirmGastoId !== null}
        titulo="¿Eliminar este gasto?"
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Borrar gasto"
        onConfirmar={execDeleteGasto}
        onCancelar={() => setConfirmGastoId(null)}
        loading={deleting}
      />

      <PedidoFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={() => { setModalOpen(false); setEditTarget(null); load() }}
        editTarget={editTarget}
        eventoIdDefault={eventoId}
      />
    </div>
  )
}
