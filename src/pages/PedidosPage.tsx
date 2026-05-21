import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, LayoutList, BarChart2, CheckCircle2, Clock, CreditCard,
  TrendingDown, TrendingUp, DollarSign, SlidersHorizontal, FlaskConical, Plus, Search, Eye, Pencil,
  LayoutGrid, ChevronDown, ChevronUp, Banknote, PackageCheck, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { PedidoConEvento, FiltrosPedidos, EstadoEntrega, EstadoPago, getPedidosGlobal, updatePedido, deletePedido } from '../api/pedidos'
import { Evento, getEventos } from '../api/eventos'
import { getGastosTotal } from '../api/materiasPrimas'
import LoadingSpinner from '../components/LoadingSpinner'
import PedidoFormModal from '../components/PedidoFormModal'
import PedidoDetailModal from '../components/PedidoDetailModal'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'

type Modo = 'tabla' | 'cards' | 'dashboard'

const etiquetaEntrega: Record<EstadoEntrega, string> = { pendiente: 'Pendiente', entregado: 'Entregado' }
const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Sin seña', señado: 'Señado', pagado: 'Pagado' }

const badgeEntrega = (e: EstadoEntrega) =>
  e === 'entregado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

const badgePago = (e: EstadoPago) =>
  e === 'pagado'
    ? 'bg-emerald-50 text-emerald-700'
    : e === 'señado'
    ? 'bg-[#CFE6F7] text-[#1F2937]'
    : 'bg-rose-50 text-rose-600'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

function toWhatsAppUrl(tel: string) {
  let digits = tel.replace(/\D/g, '')
  if (digits.startsWith('54')) return `https://wa.me/${digits}`
  if (digits.startsWith('0')) digits = digits.slice(1)
  return `https://wa.me/549${digits}`
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'

export default function PedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modo, setModo] = useState<Modo>(() => window.innerWidth < 1024 ? 'cards' : 'tabla')
  const [pedidos, setPedidos] = useState<PedidoConEvento[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosPedidos>({})
  const [eventoSelect, setEventoSelect] = useState('')
  const [totalGastosGlobal, setTotalGastosGlobal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PedidoConEvento | null>(null)
  const [viewTarget, setViewTarget] = useState<PedidoConEvento | null>(null)
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [cobrandoId, setCobrandoId] = useState<number | null>(null)
  const [cobrarMonto, setCobrarMonto] = useState('')
  const [confirmEntregarTarget, setConfirmEntregarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmPagarTarget, setConfirmPagarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PedidoConEvento | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      const [peds, evs, totalGastos] = await Promise.all([
        getPedidosGlobal(filtros),
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

  useEffect(() => { load() }, [JSON.stringify(filtros)])

  function setFiltro<K extends keyof FiltrosPedidos>(key: K, value: FiltrosPedidos[K]) {
    setFiltros(f => ({ ...f, [key]: value || undefined }))
  }

  function handleEventoSelect(val: string) {
    setEventoSelect(val)
    if (val === '') setFiltros(f => ({ ...f, eventoId: undefined, sinEvento: undefined }))
    else if (val === 'sin_evento') setFiltros(f => ({ ...f, eventoId: undefined, sinEvento: true }))
    else setFiltros(f => ({ ...f, eventoId: parseInt(val), sinEvento: undefined }))
  }

  const activeFilterCount = [
    eventoSelect !== '',
    !!filtros.estadoEntrega,
    !!filtros.estadoPago,
    !!filtros.search,
    !!(filtros.fechaDesde || filtros.fechaHasta),
  ].filter(Boolean).length

  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const pendienteCobro = totalMonto - cobrado
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pendientesEntrega = pedidos.filter(p => p.estadoEntrega === 'pendiente').length
  const gananciaNeta = cobrado - totalGastosGlobal
  const gananciaEsperada = totalMonto - totalGastosGlobal
  const sinEventoCantidad = pedidos.filter(p => !p.eventoId).length
  const sinEventoMonto = pedidos.filter(p => !p.eventoId).reduce((s, p) => s + parseFloat(p.precioTotal), 0)

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

  const porEstadoPago = (['sin_seña', 'señado', 'pagado'] as EstadoPago[]).map(estado => ({
    estado,
    cantidad: pedidos.filter(p => p.estadoPago === estado).length,
    monto: pedidos.filter(p => p.estadoPago === estado).reduce((s, p) => s + parseFloat(p.precioTotal), 0),
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
            <ShoppingCart size={16} color="#1F2937" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Pedidos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalOpen(true)} className={btnPrimary}>
            <Plus size={14} strokeWidth={2.5} />
            <span>Nuevo pedido</span>
          </button>
          <div className="flex gap-1 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-1">
            <button onClick={() => setModo('cards')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${modo === 'cards' ? 'bg-white shadow-sm font-medium text-[#1F2937] border border-[#E5EAF1]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
              <LayoutGrid size={14} strokeWidth={2} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button onClick={() => setModo('tabla')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${modo === 'tabla' ? 'bg-white shadow-sm font-medium text-[#1F2937] border border-[#E5EAF1]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
              <LayoutList size={14} strokeWidth={2} />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button onClick={() => setModo('dashboard')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${modo === 'dashboard' ? 'bg-white shadow-sm font-medium text-[#1F2937] border border-[#E5EAF1]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
              <BarChart2 size={14} strokeWidth={2} />
              <span className="hidden sm:inline">Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros colapsables */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl mb-5 overflow-hidden">
        <button
          onClick={() => setFiltrosOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F7FAFC] transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} color="#9CC6EA" strokeWidth={2} />
            <span className="text-xs font-medium text-[#6B7280]">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#CFE6F7] text-[#1F2937] text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                {activeFilterCount}
              </span>
            )}
          </div>
          {filtrosOpen
            ? <ChevronUp size={14} color="#6B7280" strokeWidth={2} />
            : <ChevronDown size={14} color="#6B7280" strokeWidth={2} />
          }
        </button>
        {filtrosOpen && (
          <div className="px-4 pb-4 border-t border-[#E5EAF1] pt-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Evento</label>
                <select className={inputClass} value={eventoSelect} onChange={e => handleEventoSelect(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="sin_evento">Sin evento</option>
                  {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Entrega</label>
                <select className={inputClass} value={filtros.estadoEntrega ?? ''} onChange={e => setFiltro('estadoEntrega', e.target.value as EstadoEntrega || undefined)}>
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Pago</label>
                <select className={inputClass} value={filtros.estadoPago ?? ''} onChange={e => setFiltro('estadoPago', e.target.value as EstadoPago || undefined)}>
                  <option value="">Todos</option>
                  <option value="sin_seña">Sin seña</option>
                  <option value="señado">Señado</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Buscar cliente</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CC6EA]" strokeWidth={2} />
                  <input
                    className="w-full border border-[#E5EAF1] rounded-xl pl-8 pr-3 py-2 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                    placeholder="Nombre del cliente..."
                    value={filtros.search ?? ''}
                    onChange={e => setFiltro('search', e.target.value || undefined)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Fecha del pedido</label>
                <div className="flex gap-2 items-center">
                  <input type="date"
                    className="flex-1 border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                    value={filtros.fechaDesde ?? ''} onChange={e => setFiltro('fechaDesde', e.target.value || undefined)}
                  />
                  <span className="text-[#6B7280] text-xs shrink-0">–</span>
                  <input type="date"
                    className="flex-1 border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                    value={filtros.fechaHasta ?? ''} onChange={e => setFiltro('fechaHasta', e.target.value || undefined)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : modo === 'cards' ? (
        pedidos.length === 0 ? (
          <EmptyState
            variant="pedidos"
            titulo="No hay pedidos"
            descripcion="No encontramos pedidos con esos filtros. Probá cambiando la búsqueda o creá uno nuevo."
            accion={
              <button onClick={() => setModalOpen(true)} className="bg-[#1F2937] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#374151] transition-colors">
                Nuevo pedido
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pedidos.map(p => (
              <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1F2937] truncate">{p.nombreCliente}</p>
                      {(p.telefono || p.cliente?.telefono) && (
                        <a href={toWhatsAppUrl((p.telefono || p.cliente!.telefono)!)}
                          target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-xl text-[#25D366] hover:bg-emerald-50 transition-colors shrink-0"
                          title="WhatsApp" onClick={e => e.stopPropagation()}>
                          <WhatsAppIcon size={20} />
                        </a>
                      )}
                    </div>
                    {p.telefono && <p className="text-xs text-[#6B7280] mt-0.5">{p.telefono}</p>}
                    {p.evento && <p className="text-xs text-[#9CC6EA] mt-0.5 font-medium">{p.evento.nombre}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <p className="text-xs text-[#6B7280] mr-1">{formatFecha(p.createdAt)}</p>
                    <button onClick={() => { setEditTarget(p); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-[#9CC6EA] hover:text-[#1F2937] hover:bg-[#F7FAFC] transition-colors" title="Editar">
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-[#9CC6EA] hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                {p.productos.length > 0 ? (
                  <ul className="flex flex-col gap-0.5">
                    {p.productos.map(pp => (
                      <li key={pp.id} className="text-xs text-[#6B7280] flex items-baseline gap-1.5">
                        <span className="font-semibold text-[#1F2937] shrink-0">{pp.cantidad}×</span>
                        <span className="truncate">{pp.producto.nombre}</span>
                      </li>
                    ))}
                  </ul>
                ) : p.descripcion ? (
                  <p className="text-xs text-[#6B7280] italic truncate">"{p.descripcion}"</p>
                ) : null}
                <p className="text-2xl font-bold text-[#1F2937]">{formatMonto(parseFloat(p.precioTotal))}</p>
                {p.montoSeña && p.estadoPago === 'señado' && (
                  <p className="text-xs text-[#6B7280] -mt-2">
                    Seña: {formatMonto(parseFloat(p.montoSeña))} · Resta: {formatMonto(parseFloat(p.precioTotal) - parseFloat(p.montoSeña))}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeEntrega(p.estadoEntrega)}`}>
                    {etiquetaEntrega[p.estadoEntrega]}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgePago(p.estadoPago)}`}>
                    {etiquetaPago[p.estadoPago]}
                  </span>
                </div>

                {/* Cobrar inline */}
                {cobrandoId === p.id && (
                  <div className="bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-3 flex flex-col gap-2.5">
                    <p className="text-xs font-semibold text-[#1F2937]">¿Cuánto cobró?</p>
                    <input
                      type="number" min="0" step="0.01" autoFocus
                      placeholder="Monto..."
                      value={cobrarMonto}
                      onChange={e => setCobrarMonto(e.target.value)}
                      className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white"
                    />
                    {cobrarMonto && parseFloat(cobrarMonto) > 0 && (() => {
                      const pagado = (p.montoSeña ? parseFloat(p.montoSeña) : 0) + parseFloat(cobrarMonto)
                      const total = parseFloat(p.precioTotal)
                      return (
                        <p className="text-xs text-[#6B7280]">
                          {pagado >= total
                            ? '✓ Cubre el total — quedará pagado'
                            : `Resta ${formatMonto(total - pagado)} tras registrar`}
                        </p>
                      )
                    })()}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setCobrandoId(null); setCobrarMonto('') }}
                        className="flex-1 py-2.5 text-sm text-[#6B7280] hover:text-[#1F2937] bg-white border border-[#E5EAF1] rounded-xl hover:bg-[#F7FAFC] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!cobrarMonto || parseFloat(cobrarMonto) <= 0}
                        onClick={() => handleCobrar(p)}
                        className="flex-1 py-2.5 text-sm font-semibold bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setViewTarget(p)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[#F7FAFC] border border-[#E5EAF1] text-[#1F2937] rounded-xl hover:bg-[#E5EAF1] transition-colors">
                    <Eye size={16} strokeWidth={2} />
                    Ver
                  </button>
                  {p.estadoPago !== 'pagado' && cobrandoId !== p.id && (
                    <button onClick={() => { setCobrandoId(p.id); setCobrarMonto('') }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[#ecfdf5] text-[#047857] rounded-xl hover:bg-[#d1fae5] transition-colors">
                      <Banknote size={16} strokeWidth={2} />
                      Cobrar
                    </button>
                  )}
                  {p.estadoPago !== 'pagado' && cobrandoId !== p.id && (
                    <button onClick={() => setConfirmPagarTarget(p)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] transition-colors">
                      <CheckCircle2 size={16} strokeWidth={2} />
                      Pagado
                    </button>
                  )}
                  {p.estadoEntrega !== 'entregado' && cobrandoId !== p.id && (
                    <button onClick={() => setConfirmEntregarTarget(p)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[#fffbeb] text-[#b45309] rounded-xl hover:bg-[#fef3c7] transition-colors">
                      <PackageCheck size={16} strokeWidth={2} />
                      Entregar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : modo === 'tabla' ? (
        pedidos.length === 0 ? (
          <EmptyState
            variant="pedidos"
            titulo="No hay pedidos"
            descripcion="No encontramos pedidos con esos filtros. Probá cambiando la búsqueda o creá uno nuevo."
            accion={
              <button onClick={() => setModalOpen(true)} className="bg-[#1F2937] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#374151] transition-colors">
                Nuevo pedido
              </button>
            }
          />
        ) : (
          <div className="bg-white border border-[#E5EAF1] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5EAF1] text-xs text-[#6B7280] font-medium">
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-left px-4 py-3">Evento</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Descripción</th>
                    <th className="text-right px-4 py-3">Precio</th>
                    <th className="text-left px-4 py-3">Entrega</th>
                    <th className="text-left px-4 py-3">Pago</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Notas</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7FAFC]">
                  {pedidos.map(p => (
                    <tr key={p.id} className="hover:bg-[#F7FAFC] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1F2937] whitespace-nowrap">{p.nombreCliente}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.evento ? (
                          <>
                            <div className="text-[#1F2937]">{p.evento.nombre}</div>
                            <div className="text-xs text-[#6B7280]">{formatFecha(p.evento.fecha)}</div>
                          </>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7FAFC] text-[#6B7280] border border-[#E5EAF1]">
                            Sin evento
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] max-w-48 hidden md:table-cell">
                        <p className="truncate">{p.descripcion}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1F2937] whitespace-nowrap">
                        {formatMonto(parseFloat(p.precioTotal))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeEntrega(p.estadoEntrega)}`}>
                          {etiquetaEntrega[p.estadoEntrega]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgePago(p.estadoPago)}`}>
                          {etiquetaPago[p.estadoPago]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] text-xs max-w-36 hidden lg:table-cell">
                        <p className="truncate italic">{p.notas ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {(p.telefono || p.cliente?.telefono) && (
                            <a
                              href={toWhatsAppUrl((p.telefono || p.cliente!.telefono)!)}
                              target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#25D366] hover:bg-emerald-50 transition-colors"
                              title="WhatsApp"
                            >
                              <WhatsAppIcon size={17} />
                            </a>
                          )}
                          <button
                            onClick={() => setViewTarget(p)}
                            className="p-1.5 rounded-lg text-[#9CC6EA] hover:text-[#1F2937] hover:bg-[#F7FAFC] transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={15} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => { setEditTarget(p); setModalOpen(true) }}
                            className="p-1.5 rounded-lg text-[#9CC6EA] hover:text-[#1F2937] hover:bg-[#F7FAFC] transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-[#9CC6EA] hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {/* Métricas de ingresos */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Ingresos</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><ShoppingCart size={14} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Total pedidos</p></div>
                <p className="text-2xl font-semibold text-[#1F2937]">{pedidos.length}</p>
                {sinEventoCantidad > 0 && <p className="text-xs text-[#6B7280] mt-0.5">{sinEventoCantidad} sin evento</p>}
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><DollarSign size={14} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Monto esperado</p></div>
                <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalMonto)}</p>
                {sinEventoMonto > 0 && <p className="text-xs text-[#6B7280] mt-0.5">{formatMonto(sinEventoMonto)} sin evento</p>}
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><CheckCircle2 size={14} color="#10b981" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Cobrado</p></div>
                <p className="text-lg font-semibold text-emerald-600">{formatMonto(cobrado)}</p>
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} color="#f59e0b" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Pendiente cobro</p></div>
                <p className="text-lg font-semibold text-amber-500">{formatMonto(pendienteCobro)}</p>
              </div>
            </div>
          </div>

          {/* Rentabilidad global */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Rentabilidad</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2"><FlaskConical size={14} color="#9CC6EA" strokeWidth={2} /><p className="text-xs text-[#6B7280]">Total gastos</p></div>
                <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalGastosGlobal)}</p>
                {filtros.eventoId && <p className="text-xs text-[#6B7280] mt-0.5">evento seleccionado</p>}
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {gananciaNeta >= 0 ? <TrendingUp size={14} color="#10b981" strokeWidth={2} /> : <TrendingDown size={14} color="#ef4444" strokeWidth={2} />}
                  <p className="text-xs text-[#6B7280]">Ganancia neta</p>
                </div>
                <p className={`text-lg font-semibold ${gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatMonto(gananciaNeta)}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">cobrado − gastos</p>
              </div>
              <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {gananciaEsperada >= 0 ? <TrendingUp size={14} color="#9CC6EA" strokeWidth={2} /> : <TrendingDown size={14} color="#f59e0b" strokeWidth={2} />}
                  <p className="text-xs text-[#6B7280]">Ganancia esperada</p>
                </div>
                <p className={`text-lg font-semibold ${gananciaEsperada >= 0 ? 'text-[#1F2937]' : 'text-amber-500'}`}>{formatMonto(gananciaEsperada)}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">total − gastos</p>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><Clock size={14} color="#9CC6EA" strokeWidth={2} /><p className="text-sm font-semibold text-[#1F2937]">Estado de entrega</p></div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium">Pendiente</span>
                  <span className="text-sm font-semibold text-[#1F2937]">{pendientesEntrega}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">Entregado</span>
                  <span className="text-sm font-semibold text-[#1F2937]">{entregados}</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><CreditCard size={14} color="#9CC6EA" strokeWidth={2} /><p className="text-sm font-semibold text-[#1F2937]">Estado de pago</p></div>
              <div className="flex flex-col gap-3">
                {porEstadoPago.map(({ estado, cantidad, monto }) => (
                  <div key={estado} className="flex items-center justify-between">
                    <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${badgePago(estado)}`}>{etiquetaPago[estado]}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#1F2937]">{cantidad}</span>
                      <span className="text-xs text-[#6B7280] ml-2">{formatMonto(monto)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
        titulo={`¿Marcar como entregado?`}
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
