import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, Plus, Search, Pencil, Trash2, ChevronDown,
  Banknote, PackageCheck, CheckCircle2, MapPin, Phone, Calendar, SlidersHorizontal,
  ChevronUp, X
} from 'lucide-react'
import { toast } from 'sonner'
import { PedidoConEvento, FiltrosPedidos, EstadoEntrega, EstadoPago, ModalidadEntrega, getPedidosGlobal, updatePedido, deletePedido } from '../api/pedidos'
import { Evento, getEventos } from '../api/eventos'
import { getGastosTotal } from '../api/materiasPrimas'
import LoadingSpinner from '../components/LoadingSpinner'
import PedidoFormModal from '../components/PedidoFormModal'
import PedidoDetailModal from '../components/PedidoDetailModal'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'

type Modo = 'tabla' | 'cards'
type QuickFilter = 'todos' | 'hoy' | 'manana' | 'porEntregar' | 'porCobrar'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

// Normaliza a YYYY-MM-DD sin importar si viene como DateTime completo de Prisma
const toDateOnly = (iso: string) => iso.substring(0, 10)

// Construye un Date a partir de una fecha sin que el timezone lo desplace un día
const parseLocalDate = (iso: string) => new Date(toDateOnly(iso) + 'T12:00:00')

const formatFecha = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatFechaDia = (iso: string) => {
  const d = parseLocalDate(iso)
  return {
    day: d.toLocaleDateString('es-AR', { day: 'numeric' }),
    rest: d.toLocaleDateString('es-AR', { weekday: 'long', month: 'long' }),
  }
}

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const esFechaHoy = (iso: string) => toDateOnly(iso) === getTodayStr()
const esFechaPasada = (iso: string) => toDateOnly(iso) < getTodayStr()

function toWhatsAppUrl(tel: string) {
  let digits = tel.replace(/\D/g, '')
  if (digits.startsWith('54')) return `https://wa.me/${digits}`
  if (digits.startsWith('0')) digits = digits.slice(1)
  return `https://wa.me/549${digits}`
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const AVATAR_TONES: [string, string][] = [
  ['#F1E4CC', '#7A5A3A'],
  ['#FBD7DC', '#8C2F3E'],
  ['#D9E9D8', '#2E5C36'],
  ['#F4D9B3', '#7E4A14'],
  ['#E0DAF1', '#473C75'],
  ['#FBE4B5', '#7C5F1B'],
]
function avatarTone(name: string): [string, string] {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_TONES[h % AVATAR_TONES.length]
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [bg, fg] = avatarTone(name)
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <div
      className="popi-avatar"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

function StatusPill({ value, kind }: { value: string; kind: 'entrega' | 'pago' }) {
  const map: Record<string, Record<string, { lbl: string; tone: string }>> = {
    entrega: {
      entregado: { lbl: 'Entregado', tone: 'mint' },
      pendiente: { lbl: 'Pendiente', tone: 'amber' },
    },
    pago: {
      pagado:    { lbl: 'Pagado',    tone: 'mint' },
      señado:    { lbl: 'Señado',    tone: 'amber' },
      sin_seña:  { lbl: 'Pendiente', tone: 'rose' },
    },
  }
  const cfg = (map[kind] || {})[value]
  if (!cfg) return <span className="popi-pill popi-pill-mute">—</span>
  return (
    <span className={`popi-pill popi-pill-${cfg.tone}`}>
      <span className="popi-pill-dot" />
      {cfg.lbl}
    </span>
  )
}

function RowDetail({
  p, onEdit, onDelete, onMarkEntregado, onMarkPagado, onCobrar
}: {
  p: PedidoConEvento
  onEdit: () => void
  onDelete: () => void
  onMarkEntregado: () => void
  onMarkPagado: () => void
  onCobrar: () => void
}) {
  const tel = p.telefono || p.cliente?.telefono
  return (
    <div className="popi-row-detail">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-1">
          <p className="text-[10.5px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-3">Detalle</p>
          {p.productos.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <tbody>
                {p.productos.map(pp => (
                  <tr key={pp.id} className="border-b border-[var(--line-2)] last:border-0">
                    <td className="py-1.5 pr-2 text-[var(--ink-3)] w-8 text-xs font-medium">{pp.cantidad}×</td>
                    <td className="py-1.5 pr-2 font-medium text-[var(--ink)]">{pp.producto.nombre}</td>
                    <td className="py-1.5 text-right font-semibold text-[var(--ink-2)] tabular-nums">
                      {formatMonto(parseFloat(pp.precioUnitario) * pp.cantidad)}
                    </td>
                  </tr>
                ))}
                {p.montoSeña && p.estadoPago === 'señado' && (
                  <>
                    <tr className="border-t border-[var(--line)]">
                      <td colSpan={2} className="pt-2.5 pb-1 text-[var(--ink-3)] text-xs">Seña abonada</td>
                      <td className="pt-2.5 pb-1 text-right text-[var(--ink-3)] text-xs tabular-nums">
                        {formatMonto(parseFloat(p.montoSeña))}
                      </td>
                    </tr>
                    <tr className="font-semibold">
                      <td colSpan={2} className="pb-1 text-[var(--ink)]">Saldo</td>
                      <td className="pb-1 text-right text-[var(--ink)] tabular-nums">
                        {formatMonto(parseFloat(p.precioTotal) - parseFloat(p.montoSeña))}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--line)] font-bold text-base">
                  <td colSpan={2} className="pt-2.5 text-[var(--ink)]">Total</td>
                  <td className="pt-2.5 text-right text-[var(--ink)] tabular-nums">{formatMonto(parseFloat(p.precioTotal))}</td>
                </tr>
              </tfoot>
            </table>
          ) : p.descripcion ? (
            <p className="text-sm text-[var(--ink-2)] italic">"{p.descripcion}"</p>
          ) : (
            <p className="text-sm text-[var(--ink-4)]">Sin detalle</p>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-[10.5px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-3">Info</p>
          <div className="flex flex-col gap-2.5 text-sm text-[var(--ink-2)]">
            {p.fechaEntrega && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--ink-4)] shrink-0" />
                <span>{formatFecha(p.fechaEntrega)}</span>
                {esFechaHoy(p.fechaEntrega) && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Hoy</span>
                )}
              </div>
            )}
            {p.modalidadEntrega && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[var(--ink-4)] shrink-0" />
                <span>{p.modalidadEntrega === 'ENVIO' ? 'Envío a domicilio' : 'Retira en local'}</span>
              </div>
            )}
            {tel && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[var(--ink-4)] shrink-0" />
                <span>{tel}</span>
              </div>
            )}
            {p.evento && (
              <div className="flex items-center gap-2">
                <ShoppingCart size={14} className="text-[var(--ink-4)] shrink-0" />
                <span className="font-medium">{p.evento.nombre}</span>
              </div>
            )}
          </div>
          {p.notas && (
            <div className="mt-4">
              <p className="text-[10.5px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-2">Notas</p>
              <div className="bg-white border border-[var(--line)] rounded-lg px-3 py-2.5 text-sm text-[var(--ink-2)] leading-relaxed">
                {p.notas}
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div>
          <p className="text-[10.5px] font-bold tracking-widest uppercase text-[var(--ink-3)] mb-3">Acciones</p>
          <div className="flex flex-col gap-2">
            {tel && (
              <a
                href={toWhatsAppUrl(tel)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--line)] bg-white text-sm font-semibold text-emerald-700 hover:bg-[var(--mint-soft)] transition-colors"
              >
                <WhatsAppIcon size={16} />
                WhatsApp
              </a>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--line)] bg-white text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream-1)] transition-colors"
            >
              <Pencil size={14} />
              Editar pedido
            </button>
            {p.estadoEntrega !== 'entregado' && (
              <button
                onClick={onMarkEntregado}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--line)] bg-white text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition-colors"
              >
                <PackageCheck size={14} />
                Marcar entregado
              </button>
            )}
            {p.estadoPago !== 'pagado' && (
              <button
                onClick={onCobrar}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--line)] bg-white text-sm font-semibold text-[var(--ink)] hover:bg-[var(--mint-soft)] transition-colors"
              >
                <Banknote size={14} />
                Registrar cobro
              </button>
            )}
            {p.estadoPago !== 'pagado' && (
              <button
                onClick={onMarkPagado}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--ink)] text-sm font-semibold text-[var(--cream-0)] hover:opacity-90 transition-colors"
              >
                <CheckCircle2 size={14} />
                Marcar pagado
              </button>
            )}
            <button
              onClick={onDelete}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors mt-1"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modo, setModo] = useState<Modo>(() => window.innerWidth < 768 ? 'cards' : 'tabla')
  const [pedidos, setPedidos] = useState<PedidoConEvento[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosPedidos>({})
  const [filtroPor, setFiltroPor] = useState<'creacion' | 'entrega'>('entrega')
  const [eventoSelect, setEventoSelect] = useState('')
  const [totalGastosGlobal, setTotalGastosGlobal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PedidoConEvento | null>(null)
  const [viewTarget, setViewTarget] = useState<PedidoConEvento | null>(null)
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [cobrandoId, setCobrandoId] = useState<number | null>(null)
  const [cobrarMonto, setCobrarMonto] = useState('')
  const [confirmEntregarTarget, setConfirmEntregarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmPagarTarget, setConfirmPagarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PedidoConEvento | null>(null)
  const [deleting, setDeleting] = useState(false)

  const today = getTodayStr()
  const tomorrow = getTomorrowStr()

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  async function load() {
    setLoading(true)
    try {
      const gastosFilter = { eventoId: filtros.eventoId, fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta }
      const filtrosConPor: FiltrosPedidos = {
        ...filtros,
        ...(filtros.fechaDesde || filtros.fechaHasta ? { filtroPor } : {}),
      }
      const [peds, evs, totalGastos] = await Promise.all([
        getPedidosGlobal(filtrosConPor),
        getEventos(),
        getGastosTotal(gastosFilter),
      ])
      setPedidos(peds)
      setEventos(evs)
      setTotalGastosGlobal(totalGastos)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [JSON.stringify(filtros), filtroPor])

  function setFiltro<K extends keyof FiltrosPedidos>(key: K, value: FiltrosPedidos[K]) {
    setFiltros(f => ({ ...f, [key]: value || undefined }))
  }

  function handleEventoSelect(val: string) {
    setEventoSelect(val)
    if (val === '') setFiltros(f => ({ ...f, eventoId: undefined, sinEvento: undefined }))
    else if (val === 'sin_evento') setFiltros(f => ({ ...f, eventoId: undefined, sinEvento: true }))
    else setFiltros(f => ({ ...f, eventoId: parseInt(val), sinEvento: undefined }))
  }

  // Quick filters + search applied client-side on top of server-filtered data
  const filtered = useMemo(() => {
    let arr = pedidos.slice()
    if (quickFilter === 'hoy')         arr = arr.filter(o => o.fechaEntrega && toDateOnly(o.fechaEntrega) === today)
    else if (quickFilter === 'manana') arr = arr.filter(o => o.fechaEntrega && toDateOnly(o.fechaEntrega) === tomorrow)
    else if (quickFilter === 'porEntregar') arr = arr.filter(o => o.estadoEntrega !== 'entregado')
    else if (quickFilter === 'porCobrar')   arr = arr.filter(o => o.estadoPago !== 'pagado')

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      arr = arr.filter(o =>
        o.nombreCliente.toLowerCase().includes(q) ||
        (o.evento?.nombre || '').toLowerCase().includes(q) ||
        (o.descripcion || '').toLowerCase().includes(q) ||
        (o.notas || '').toLowerCase().includes(q)
      )
    }
    return arr.sort((a, b) => {
      const fa = a.fechaEntrega ? toDateOnly(a.fechaEntrega) : '9999'
      const fb = b.fechaEntrega ? toDateOnly(b.fechaEntrega) : '9999'
      return fa.localeCompare(fb)
    })
  }, [pedidos, quickFilter, searchQuery, today, tomorrow])

  // Group by fechaEntrega
  const grouped = useMemo(() => {
    const map = new Map<string, PedidoConEvento[]>()
    for (const p of filtered) {
      const key = p.fechaEntrega ? toDateOnly(p.fechaEntrega) : 'sin-fecha'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries())
  }, [filtered])

  // Counts for chips
  const counts = {
    todos:       pedidos.length,
    hoy:         pedidos.filter(o => o.fechaEntrega && toDateOnly(o.fechaEntrega) === today).length,
    manana:      pedidos.filter(o => o.fechaEntrega && toDateOnly(o.fechaEntrega) === tomorrow).length,
    porEntregar: pedidos.filter(o => o.estadoEntrega !== 'entregado').length,
    porCobrar:   pedidos.filter(o => o.estadoPago !== 'pagado').length,
  }

  // KPIs
  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const pendienteCobro = totalMonto - cobrado
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length

  const advancedFilterCount = [
    eventoSelect !== '',
    !!filtros.estadoEntrega,
    !!filtros.estadoPago,
    !!(filtros.fechaDesde || filtros.fechaHasta),
    !!filtros.modalidadEntrega,
  ].filter(Boolean).length

  async function handleConfirmarEntregado() {
    if (!confirmEntregarTarget) return
    setConfirmando(true)
    try {
      await updatePedido(confirmEntregarTarget.id, { estadoEntrega: 'entregado' })
      toast.success('Pedido marcado como entregado')
      setConfirmEntregarTarget(null)
      load()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setConfirmando(false)
    }
  }

  async function handleConfirmarPagado() {
    if (!confirmPagarTarget) return
    setConfirmando(true)
    try {
      await updatePedido(confirmPagarTarget.id, { estadoPago: 'pagado', montoSeña: null })
      toast.success('Pedido marcado como pagado')
      setConfirmPagarTarget(null)
      load()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setConfirmando(false)
    }
  }

  async function handleCobrar(p: PedidoConEvento) {
    const monto = parseFloat(cobrarMonto)
    if (!monto || monto <= 0) return
    try {
      const seniaAnterior = p.montoSeña ? parseFloat(p.montoSeña) : 0
      const nuevaSenia = seniaAnterior + monto
      const total = parseFloat(p.precioTotal)
      const nuevoEstado: EstadoPago = nuevaSenia >= total ? 'pagado' : 'señado'
      await updatePedido(p.id, { estadoPago: nuevoEstado, montoSeña: nuevaSenia })
      toast.success(nuevoEstado === 'pagado' ? 'Pagado en su totalidad' : `Seña de ${formatMonto(monto)} registrada`)
      setCobrandoId(null)
      setCobrarMonto('')
      load()
    } catch {
      toast.error('Error al registrar el pago')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePedido(deleteTarget.id)
      toast.success('Pedido eliminado')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Error al eliminar el pedido')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass = 'w-full border border-[var(--line)] rounded-xl px-2.5 py-2 text-sm text-[var(--ink)] focus:outline-none bg-white transition-colors placeholder-[var(--ink-4)]'

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-10">

      {/* ── Page header ─────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-[var(--ink-3)] mb-1">Gestión</p>
          <h1
            className="font-serif text-5xl leading-none tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Pedidos
          </h1>
          {!loading && (
            <p className="text-sm text-[var(--ink-3)] mt-2">
              <strong className="text-[var(--ink)] font-semibold">{filtered.length}</strong> pedido{filtered.length !== 1 ? 's' : ''} ·{' '}
              <strong className="text-[var(--ink)] font-semibold">{entregados}</strong> entregado{entregados !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 bg-white border border-[var(--line)] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setModo('tabla')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${modo === 'tabla' ? 'bg-[var(--ink)] text-[var(--cream-0)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
            >
              Tabla
            </button>
            <button
              onClick={() => setModo('cards')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${modo === 'cards' ? 'bg-[var(--ink)] text-[var(--cream-0)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}
            >
              Cards
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--cream-0)] text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            style={{ boxShadow: '0 1px 2px rgba(42,31,26,0.12), 0 6px 16px -8px rgba(42,31,26,0.35)' }}
          >
            <Plus size={15} strokeWidth={2.5} />
            Nuevo pedido
          </button>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="popi-kpi" style={{ '--kpi-accent': 'var(--ink)' } as React.CSSProperties}>
            <p className="text-[11px] font-bold tracking-wide uppercase text-[var(--ink-3)] mb-1.5">Total</p>
            <p className="text-3xl font-bold text-[var(--ink)] leading-none">{pedidos.length}</p>
            <p className="text-xs text-[var(--ink-4)] mt-1.5">{counts.porEntregar} por entregar</p>
          </div>
          <div className="popi-kpi" style={{ '--kpi-accent': 'oklch(0.72 0.14 70)' } as React.CSSProperties}>
            <p className="text-[11px] font-bold tracking-wide uppercase text-[var(--ink-3)] mb-1.5">Facturado</p>
            <p className="text-xl font-bold text-[var(--ink)] leading-none tabular-nums">{formatMonto(totalMonto)}</p>
            <p className="text-xs text-[var(--ink-4)] mt-1.5">esperado total</p>
          </div>
          <div className="popi-kpi" style={{ '--kpi-accent': 'oklch(0.62 0.11 150)' } as React.CSSProperties}>
            <p className="text-[11px] font-bold tracking-wide uppercase text-[var(--ink-3)] mb-1.5">Cobrado</p>
            <p className="text-xl font-bold leading-none tabular-nums" style={{ color: 'oklch(0.36 0.10 145)' }}>{formatMonto(cobrado)}</p>
            <p className="text-xs text-[var(--ink-4)] mt-1.5">pagos completos</p>
          </div>
          <div className="popi-kpi" style={{ '--kpi-accent': 'oklch(0.62 0.16 20)' } as React.CSSProperties}>
            <p className="text-[11px] font-bold tracking-wide uppercase text-[var(--ink-3)] mb-1.5">Por cobrar</p>
            <p className="text-xl font-bold leading-none tabular-nums" style={{ color: 'oklch(0.42 0.16 22)' }}>{formatMonto(pendienteCobro)}</p>
            <p className="text-xs text-[var(--ink-4)] mt-1.5">{counts.porCobrar} pedidos</p>
          </div>
        </div>
      )}

      {/* ── Filter bar ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { id: 'todos',       lbl: 'Todos',        count: counts.todos },
            { id: 'hoy',         lbl: 'Hoy',          count: counts.hoy },
            { id: 'manana',      lbl: 'Mañana',       count: counts.manana },
            { id: 'porEntregar', lbl: 'Por entregar', count: counts.porEntregar },
            { id: 'porCobrar',   lbl: 'Por cobrar',   count: counts.porCobrar },
          ] as { id: QuickFilter; lbl: string; count: number }[]).map(c => (
            <button
              key={c.id}
              className={`popi-chip ${quickFilter === c.id ? 'active' : ''}`}
              onClick={() => setQuickFilter(c.id)}
            >
              {c.lbl}
              <span className="popi-chip-count">{c.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="popi-search" style={{ width: 280 }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar cliente, evento..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--cream-1)] transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {/* Filtros avanzados */}
          <button
            onClick={() => setFiltrosOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${filtrosOpen || advancedFilterCount > 0 ? 'bg-[var(--ink)] text-[var(--cream-0)] border-[var(--ink)]' : 'bg-white border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filtros</span>
            {advancedFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">{advancedFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros avanzados colapsables */}
      {filtrosOpen && (
        <div className="bg-white border border-[var(--line)] rounded-2xl px-4 py-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">Evento</label>
            <select className={inputClass} value={eventoSelect} onChange={e => handleEventoSelect(e.target.value)}>
              <option value="">Todos</option>
              <option value="sin_evento">Sin evento</option>
              {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">Entrega</label>
            <select className={inputClass} value={filtros.estadoEntrega ?? ''} onChange={e => setFiltro('estadoEntrega', e.target.value as EstadoEntrega || undefined)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">Pago</label>
            <select className={inputClass} value={filtros.estadoPago ?? ''} onChange={e => setFiltro('estadoPago', e.target.value as EstadoPago || undefined)}>
              <option value="">Todos</option>
              <option value="sin_seña">Pendiente</option>
              <option value="señado">Señado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)] mb-1.5">Modalidad</label>
            <select className={inputClass} value={filtros.modalidadEntrega ?? ''} onChange={e => setFiltro('modalidadEntrega', e.target.value as ModalidadEntrega || undefined)}>
              <option value="">Todos</option>
              <option value="ENVIO">Envío</option>
              <option value="RETIRA">Retira</option>
            </select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-3)]">Fecha</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setFiltroPor('entrega')}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${filtroPor === 'entrega' ? 'bg-[var(--ink)] text-[var(--cream-0)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}>
                  Entrega
                </button>
                <button type="button" onClick={() => setFiltroPor('creacion')}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${filtroPor === 'creacion' ? 'bg-[var(--ink)] text-[var(--cream-0)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]'}`}>
                  Creación
                </button>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input type="date" className={inputClass} value={filtros.fechaDesde ?? ''} onChange={e => setFiltro('fechaDesde', e.target.value || undefined)} />
              <span className="text-[var(--ink-3)] text-xs shrink-0">–</span>
              <input type="date" className={inputClass} value={filtros.fechaHasta ?? ''} onChange={e => setFiltro('fechaHasta', e.target.value || undefined)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant="pedidos"
          titulo="No hay pedidos"
          descripcion="No encontramos pedidos. Probá cambiando los filtros o creá uno nuevo."
          accion={
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--cream-0)] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Nuevo pedido
            </button>
          }
        />
      ) : modo === 'tabla' ? (

        /* ── TABLE VIEW ─────────────────────────────── */
        <div className="popi-table-card">
          {/* Table head */}
          <div className="hidden md:block">
            <div className="popi-table-thead">
              <span>Cliente</span>
              <span>Descripción</span>
              <span>Entrega</span>
              <span>Pago</span>
              <span className="text-right">Precio</span>
            </div>
          </div>

          {/* Grouped rows */}
          {grouped.map(([fecha, items]) => {
            const fechaLabel = fecha === 'sin-fecha'
              ? { day: '—', rest: 'sin fecha de entrega' }
              : formatFechaDia(fecha)
            const groupTotal = items.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
            const isToday = fecha === today
            const isTomorrow = fecha === tomorrow

            return (
              <div key={fecha}>
                {/* Group header */}
                <div className="flex items-baseline justify-between px-5 py-3 border-t border-[var(--line-2)] first:border-0 bg-[var(--cream-0)/50]">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-bold text-xl leading-none text-[var(--ink)]"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      {fechaLabel.day}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] capitalize">{fechaLabel.rest}</span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Hoy</span>
                    )}
                    {isTomorrow && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Mañana</span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--ink-3)] font-medium">
                    {items.length} pedido{items.length !== 1 ? 's' : ''} · {formatMonto(groupTotal)}
                  </span>
                </div>

                {/* Rows */}
                {items.map(p => {
                  const isExpanded = expandedId === p.id
                  const tel = p.telefono || p.cliente?.telefono
                  const hasPendingPago = p.estadoPago === 'sin_seña'
                  const hasPendingEntrega = p.estadoEntrega === 'pendiente' && fecha !== 'sin-fecha' && esFechaPasada(fecha)

                  return (
                    <div key={p.id}>
                      <div className="hidden md:block">
                      <button
                        className={`popi-table-row w-full ${isExpanded ? 'expanded' : ''} ${hasPendingPago ? 'has-rose' : hasPendingEntrega ? 'has-amber' : ''}`}
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        {/* Cliente */}
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={p.nombreCliente} size={34} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--ink)] truncate">{p.nombreCliente}</p>
                            {tel && (
                              <p className="text-xs text-[var(--ink-4)] truncate">{tel}</p>
                            )}
                          </div>
                        </div>

                        {/* Descripción / Evento */}
                        <div className="min-w-0 pr-3">
                          {p.evento && (
                            <span className="inline-block text-[11px] font-semibold px-2 py-0.5 bg-[var(--cream-1)] text-[var(--ink-2)] rounded mb-1">
                              {p.evento.nombre}
                            </span>
                          )}
                          <p className="text-xs text-[var(--ink-3)] truncate">
                            {p.productos.length > 0
                              ? p.productos.map(pp => `${pp.cantidad}× ${pp.producto.nombre}`).join(', ')
                              : p.descripcion || '—'}
                          </p>
                        </div>

                        {/* Entrega */}
                        <div>
                          <StatusPill value={p.estadoEntrega} kind="entrega" />
                        </div>

                        {/* Pago */}
                        <div>
                          <StatusPill value={p.estadoPago} kind="pago" />
                          {p.montoSeña && p.estadoPago === 'señado' && (
                            <p className="text-[10px] text-[var(--ink-4)] mt-0.5 tabular-nums">
                              Seña {formatMonto(parseFloat(p.montoSeña))}
                            </p>
                          )}
                        </div>

                        {/* Precio + chevron */}
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right">
                            <p className="text-sm font-bold text-[var(--ink)] tabular-nums">{formatMonto(parseFloat(p.precioTotal))}</p>
                          </div>
                          <ChevronDown
                            size={16}
                            className="text-[var(--ink-4)] shrink-0 transition-transform"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                        </div>
                      </button>
                      </div>

                      {/* Mobile card row */}
                      <div
                        className={`md:hidden p-4 border-t border-[var(--line-2)] cursor-pointer transition-colors ${isExpanded ? 'bg-[oklch(0.96_0.025_65_/_0.5)]' : 'hover:bg-[var(--cream-0)/70]'}`}
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={p.nombreCliente} size={32} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--ink)]">{p.nombreCliente}</p>
                              <p className="text-xs text-[var(--ink-3)] truncate">
                                {p.productos.length > 0
                                  ? p.productos.map(pp => `${pp.cantidad}× ${pp.producto.nombre}`).join(', ')
                                  : p.descripcion || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold tabular-nums text-[var(--ink)]">{formatMonto(parseFloat(p.precioTotal))}</p>
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--cream-1)]">
                              <ChevronDown
                                size={18}
                                className="text-[var(--ink-3)] transition-transform"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <StatusPill value={p.estadoEntrega} kind="entrega" />
                          <StatusPill value={p.estadoPago} kind="pago" />
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        cobrandoId === p.id ? (
                          <div className="popi-row-detail">
                            <div className="max-w-sm">
                              <p className="text-sm font-semibold text-[var(--ink)] mb-3">¿Cuánto cobró?</p>
                              <input
                                type="number" min="0" step="0.01" autoFocus
                                placeholder="Monto..."
                                value={cobrarMonto}
                                onChange={e => setCobrarMonto(e.target.value)}
                                className="w-full border border-[var(--line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] bg-white focus:outline-none mb-2"
                              />
                              {cobrarMonto && parseFloat(cobrarMonto) > 0 && (() => {
                                const pagado = (p.montoSeña ? parseFloat(p.montoSeña) : 0) + parseFloat(cobrarMonto)
                                const total = parseFloat(p.precioTotal)
                                return (
                                  <p className="text-xs text-[var(--ink-3)] mb-3">
                                    {pagado >= total
                                      ? '✓ Cubre el total — quedará pagado'
                                      : `Resta ${formatMonto(total - pagado)} tras registrar`}
                                  </p>
                                )
                              })()}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setCobrandoId(null); setCobrarMonto('') }}
                                  className="flex-1 py-2.5 text-sm font-semibold text-[var(--ink-2)] bg-white border border-[var(--line)] rounded-xl hover:bg-[var(--cream-1)] transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  disabled={!cobrarMonto || parseFloat(cobrarMonto) <= 0}
                                  onClick={() => handleCobrar(p)}
                                  className="flex-1 py-2.5 text-sm font-semibold bg-[var(--ink)] text-[var(--cream-0)] rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <RowDetail
                            p={p}
                            onEdit={() => { setEditTarget(p); setModalOpen(true) }}
                            onDelete={() => setDeleteTarget(p)}
                            onMarkEntregado={() => setConfirmEntregarTarget(p)}
                            onMarkPagado={() => setConfirmPagarTarget(p)}
                            onCobrar={() => { setCobrandoId(p.id); setCobrarMonto('') }}
                          />
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

      ) : (

        /* ── CARDS VIEW ─────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="bg-white border border-[var(--line)] rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 1px 2px rgba(42,31,26,0.04)' }}
            >
              {/* Top */}
              <div className="flex items-center justify-between">
                {p.fechaEntrega ? (
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-xl font-bold text-[var(--ink)]"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      {formatFechaDia(p.fechaEntrega).day}
                    </span>
                    <span className="text-xs text-[var(--ink-3)] capitalize">{formatFechaDia(p.fechaEntrega).rest}</span>
                    {esFechaHoy(p.fechaEntrega) && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Hoy</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--ink-4)]">Sin fecha</span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditTarget(p); setModalOpen(true) }}
                    className="p-1.5 rounded-lg text-[var(--ink-4)] hover:text-[var(--ink)] hover:bg-[var(--cream-1)] transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 rounded-lg text-[var(--ink-4)] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Client */}
              <div className="flex items-center gap-3">
                <Avatar name={p.nombreCliente} size={38} />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[var(--ink)] truncate">{p.nombreCliente}</p>
                  {p.evento && <p className="text-xs text-[var(--ink-3)]">{p.evento.nombre}</p>}
                </div>
              </div>

              {/* Description */}
              {(p.productos.length > 0 || p.descripcion) && (
                <p className="text-xs text-[var(--ink-2)] border-l-2 border-[var(--cream-2)] pl-2.5 leading-relaxed line-clamp-2">
                  {p.productos.length > 0
                    ? p.productos.map(pp => `${pp.cantidad}× ${pp.producto.nombre}`).join(', ')
                    : p.descripcion}
                </p>
              )}

              {/* Notes */}
              {p.notas && (
                <div className="bg-[var(--amber-soft)] rounded-lg px-2.5 py-2 text-xs text-[oklch(0.42_0.13_65)] leading-relaxed line-clamp-2">
                  {p.notas}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[var(--line-2)] mt-auto">
                <p
                  className="text-2xl font-bold text-[var(--ink)] tabular-nums"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {formatMonto(parseFloat(p.precioTotal))}
                </p>
                <div className="flex gap-1.5">
                  <StatusPill value={p.estadoEntrega} kind="entrega" />
                  <StatusPill value={p.estadoPago} kind="pago" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(p.telefono || p.cliente?.telefono) && (
                  <a
                    href={toWhatsAppUrl((p.telefono || p.cliente!.telefono)!)}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-[var(--mint-soft)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <WhatsAppIcon size={13} />
                    WA
                  </a>
                )}
                {p.estadoPago !== 'pagado' && (
                  <button
                    onClick={() => { setCobrandoId(p.id); setExpandedId(p.id); setModo('tabla') }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[oklch(0.36_0.10_145)] bg-[var(--mint-soft)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Banknote size={13} />
                    Cobrar
                  </button>
                )}
                {p.estadoEntrega !== 'entregado' && (
                  <button
                    onClick={() => setConfirmEntregarTarget(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[oklch(0.42_0.13_65)] bg-[var(--amber-soft)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <PackageCheck size={13} />
                    Entregar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────── */}
      <PedidoFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={(pedido) => {
          setModalOpen(false)
          setEditTarget(null)
          load()
          if (pedido) setViewTarget(pedido)
        }}
        editTarget={editTarget}
      />

      <PedidoDetailModal
        pedido={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); setModalOpen(true) }}
      />

      <ConfirmModal
        isOpen={confirmEntregarTarget !== null}
        variant="confirm"
        titulo="¿Marcar como entregado?"
        descripcion={confirmEntregarTarget ? `Pedido de ${confirmEntregarTarget.nombreCliente}` : undefined}
        labelConfirmar="Marcar entregado"
        onConfirmar={handleConfirmarEntregado}
        onCancelar={() => setConfirmEntregarTarget(null)}
        loading={confirmando}
      />

      <ConfirmModal
        isOpen={confirmPagarTarget !== null}
        variant="confirm"
        titulo="¿Marcar como pagado?"
        descripcion={confirmPagarTarget
          ? `${confirmPagarTarget.nombreCliente} · ${formatMonto(parseFloat(confirmPagarTarget.precioTotal))}`
          : undefined}
        labelConfirmar="Marcar pagado"
        onConfirmar={handleConfirmarPagado}
        onCancelar={() => setConfirmPagarTarget(null)}
        loading={confirmando}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        variant="danger"
        titulo={`¿Eliminar pedido de "${deleteTarget?.nombreCliente}"?`}
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Eliminar"
        onConfirmar={handleDelete}
        onCancelar={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
