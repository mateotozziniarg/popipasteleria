import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Banknote, PackageCheck, CheckCircle2, StickyNote, Calendar, BarChart2, Receipt, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { PedidoConEvento, EstadoPago, getPedidosGlobal, updatePedido } from '../api/pedidos'
import { getResumenFinanciero, getGastos, Gasto, ResumenFinanciero } from '../api/gastos'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import PedidoDetailModal from '../components/PedidoDetailModal'
import PedidoFormModal from '../components/PedidoFormModal'

// ── helpers ────────────────────────────────────────────────────────

const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Pendiente', señado: 'Señado', pagado: 'Pagado' }

const badgePago = (e: EstadoPago) =>
  e === 'pagado' ? 'bg-emerald-50 text-emerald-700'
  : e === 'señado' ? 'bg-[#CFE6F7] text-[#1F2937]'
  : 'bg-rose-50 text-rose-600'

const badgeEntrega = (e: 'pendiente' | 'entregado') =>
  e === 'entregado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const formatFechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const esHoy = (iso: string) => iso.substring(0, 10) === getTodayStr()
const esPasada = (iso: string) => iso.substring(0, 10) < getTodayStr()

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Periodo = 'semana' | 'mes' | 'anio' | 'personalizado'

function getPeriodoRange(p: Periodo): { desde: string; hasta: string } {
  const now = new Date()
  if (p === 'semana') {
    const dow = now.getDay()
    const sinceMonday = dow === 0 ? 6 : dow - 1
    const mon = new Date(now); mon.setDate(now.getDate() - sinceMonday)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { desde: getDateStr(mon), hasta: getDateStr(sun) }
  }
  if (p === 'mes') {
    return {
      desde: getDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
      hasta: getDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (p === 'anio') {
    return { desde: `${now.getFullYear()}-01-01`, hasta: `${now.getFullYear()}-12-31` }
  }
  return { desde: '', hasta: '' }
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchClimaMañana(): Promise<{ maxHumedad: number; maxRocio: number } | null> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&hourly=relative_humidity_2m,dew_point_2m&forecast_days=2&timezone=America%2FArgentina%2FBuenos_Aires'
  const res = await fetch(url)
  const data = await res.json()
  const tomorrow = getTomorrowStr()
  const times: string[] = data.hourly.time
  const humedades: number[] = data.hourly.relative_humidity_2m
  const rocios: number[] = data.hourly.dew_point_2m
  const idxs = times
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => {
      if (!t.startsWith(tomorrow)) return false
      const h = parseInt(t.slice(11, 13))
      return h >= 8 && h <= 20
    })
    .map(({ i }) => i)
  if (idxs.length === 0) return null
  return {
    maxHumedad: Math.max(...idxs.map(i => humedades[i])),
    maxRocio: Math.round(Math.max(...idxs.map(i => rocios[i]))),
  }
}

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

// ── TrendBadge ──────────────────────────────────────────────────────

function TrendBadge({ curr, prev, positiveIsGood = true }: { curr: number; prev: number; positiveIsGood?: boolean }) {
  const pct = pctChange(curr, prev)
  if (pct === null) return null
  const isPositive = pct >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-rose-500'}`}>
      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

// ── main component ─────────────────────────────────────────────────

export default function WorkspacePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'hoy' | 'finanzas'>('hoy')

  // ── Hoy tab state ──
  const [pedidos, setPedidos] = useState<PedidoConEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [viewTarget, setViewTarget] = useState<PedidoConEvento | null>(null)
  const [editTarget, setEditTarget] = useState<PedidoConEvento | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cobrandoId, setCobrandoId] = useState<number | null>(null)
  const [cobrarMonto, setCobrarMonto] = useState('')
  const [confirmEntregarTarget, setConfirmEntregarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmPagarTarget, setConfirmPagarTarget] = useState<PedidoConEvento | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [climaMañana, setClimaMañana] = useState<{ maxHumedad: number; maxRocio: number } | null>(null)

  // ── Finanzas tab state ──
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null)
  const [gastosRecientes, setGastosRecientes] = useState<Gasto[]>([])
  const [loadingFinanzas, setLoadingFinanzas] = useState(false)

  async function loadPedidos() {
    setLoading(true)
    try {
      setPedidos(await getPedidosGlobal({}))
    } finally {
      setLoading(false)
    }
  }

  async function loadFinanzas(desde: string, hasta: string) {
    if (!desde || !hasta) return
    setLoadingFinanzas(true)
    try {
      const [r, g] = await Promise.all([
        getResumenFinanciero(desde, hasta),
        getGastos({ fechaDesde: desde, fechaHasta: hasta }),
      ])
      setResumen(r)
      setGastosRecientes(g.slice(0, 5))
    } catch {
      toast.error('Error al cargar finanzas')
    } finally {
      setLoadingFinanzas(false)
    }
  }

  useEffect(() => { loadPedidos() }, [])

  useEffect(() => {
    if (activeTab !== 'finanzas') return
    if (periodo === 'personalizado') {
      if (customDesde && customHasta && customDesde <= customHasta) {
        loadFinanzas(customDesde, customHasta)
      }
      return
    }
    const { desde, hasta } = getPeriodoRange(periodo)
    loadFinanzas(desde, hasta)
  }, [activeTab, periodo, customDesde, customHasta])

  useEffect(() => {
    fetchClimaMañana().then(data => {
      if (data && (data.maxRocio > 15 || data.maxHumedad > 70)) setClimaMañana(data)
      else setClimaMañana(null)
    }).catch(() => {})
  }, [])

  async function handleConfirmarEntregado() {
    if (!confirmEntregarTarget) return
    setConfirmando(true)
    try {
      await updatePedido(confirmEntregarTarget.id, { estadoEntrega: 'entregado' })
      toast.success('Pedido marcado como entregado')
      setConfirmEntregarTarget(null)
      loadPedidos()
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
      loadPedidos()
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
      loadPedidos()
    } catch {
      toast.error('Error al registrar el pago')
    }
  }

  const sortByFecha = (a: PedidoConEvento, b: PedidoConEvento) => {
    if (a.fechaEntrega && b.fechaEntrega) return a.fechaEntrega.localeCompare(b.fechaEntrega)
    if (a.fechaEntrega && !b.fechaEntrega) return -1
    if (!a.fechaEntrega && b.fechaEntrega) return 1
    return 0
  }

  const pendientesAmbos = pedidos
    .filter(p => p.estadoEntrega === 'pendiente' && p.estadoPago !== 'pagado')
    .sort(sortByFecha)

  const pendientesEntregaSolo = pedidos
    .filter(p => p.estadoEntrega === 'pendiente' && p.estadoPago === 'pagado')
    .sort(sortByFecha)

  const pendientesCobroSolo = pedidos
    .filter(p => p.estadoEntrega === 'entregado' && p.estadoPago !== 'pagado')

  const enviosPendientes = [...pendientesAmbos, ...pendientesEntregaSolo].filter(p => p.modalidadEntrega === 'ENVIO').length

  const allClear = !loading && pendientesAmbos.length === 0 && pendientesEntregaSolo.length === 0 && pendientesCobroSolo.length === 0

  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoyCapitalizado = hoy.charAt(0).toUpperCase() + hoy.slice(1)

  const periodoLabels: Record<Periodo, string> = {
    semana: 'Esta semana',
    mes: 'Este mes',
    anio: 'Este año',
    personalizado: 'Personalizado',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('hoy')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'hoy' ? 'bg-white text-[#1F2937] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
        >
          <Zap size={14} strokeWidth={2} />
          Hoy
        </button>
        <button
          onClick={() => setActiveTab('finanzas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'finanzas' ? 'bg-white text-[#1F2937] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'}`}
        >
          <BarChart2 size={14} strokeWidth={2} />
          Finanzas
        </button>
      </div>

      {/* ════════════════ TAB HOY ════════════════ */}
      {activeTab === 'hoy' && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
              <Zap size={16} color="#1F2937" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#1F2937]">Buen día</h1>
              <p className="text-xs text-[#6B7280]">{hoyCapitalizado}</p>
            </div>
            {!loading && (pendientesAmbos.length > 0 || pendientesEntregaSolo.length > 0 || pendientesCobroSolo.length > 0) && (
              <div className="ml-auto flex gap-2 flex-wrap justify-end">
                {(pendientesAmbos.length + pendientesEntregaSolo.length) > 0 && (
                  <span className="text-xs bg-[#fffbeb] text-[#b45309] px-2.5 py-1 rounded-full font-medium">
                    {pendientesAmbos.length + pendientesEntregaSolo.length} por entregar
                  </span>
                )}
                {enviosPendientes > 0 && (
                  <span className="text-xs bg-[#CFE6F7] text-[#1F2937] px-2.5 py-1 rounded-full font-medium">
                    {enviosPendientes} {enviosPendientes === 1 ? 'envío' : 'envíos'}
                  </span>
                )}
                {(pendientesAmbos.length + pendientesCobroSolo.length) > 0 && (
                  <span className="text-xs bg-[#ecfdf5] text-[#047857] px-2.5 py-1 rounded-full font-medium">
                    {pendientesAmbos.length + pendientesCobroSolo.length} por cobrar
                  </span>
                )}
              </div>
            )}
          </div>

          {climaMañana && (
            <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-amber-900">Mañana condiciones difíciles para templar</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Punto de rocío máx. {climaMañana.maxRocio}°C · Humedad máx. {climaMañana.maxHumedad}% · Cuidado con chocolate, merengues y macarons.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : allClear ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-lg font-semibold text-[#1F2937]">Todo al día</p>
              <p className="text-sm text-[#6B7280] mt-1 max-w-xs">
                No hay pedidos pendientes de entrega ni de cobro. ¡A seguir cocinando!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">

              {/* ── Sección: por entregar y cobrar ── */}
              {pendientesAmbos.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <PackageCheck size={14} color="#9CC6EA" strokeWidth={2} />
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Pendiente de entrega y cobro
                    </p>
                    <span className="ml-auto text-xs text-[#6B7280]">
                      {pendientesAmbos.length} · {formatMonto(pendientesAmbos.reduce((s, p) => s + parseFloat(p.precioTotal), 0))}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pendientesAmbos.map(p => {
                      const tel = p.telefono ?? p.cliente?.telefono ?? null
                      return (
                        <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#1F2937] text-sm truncate">{p.nombreCliente}</p>
                                {p.modalidadEntrega && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.modalidadEntrega === 'ENVIO' ? 'bg-[#CFE6F7] text-[#1F2937]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                    {p.modalidadEntrega === 'ENVIO' ? 'Envío' : 'Retira'}
                                  </span>
                                )}
                              </div>
                              {p.evento && <p className="text-xs text-[#9CC6EA] font-medium truncate">{p.evento.nombre}</p>}
                              {p.fechaEntrega && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Calendar size={11} className={`shrink-0 ${esPasada(p.fechaEntrega) ? 'text-red-400' : 'text-[#9CC6EA]'}`} strokeWidth={2} />
                                  <span className={`text-xs font-medium ${esPasada(p.fechaEntrega) ? 'text-red-500' : 'text-[#6B7280]'}`}>
                                    {formatFechaCorta(p.fechaEntrega)}
                                  </span>
                                  {esHoy(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">Hoy</span>
                                  )}
                                  {esPasada(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full leading-none">Vencido</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {tel && (
                              <a href={toWhatsAppUrl(tel)} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-xl text-[#25D366] hover:bg-emerald-50 transition-colors shrink-0"
                                title={`WhatsApp ${tel}`}>
                                <WhatsAppIcon size={22} />
                              </a>
                            )}
                          </div>

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
                          {p.notas && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                              <StickyNote size={13} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                              <p className="text-xs text-amber-900 leading-relaxed font-medium">{p.notas}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xl font-bold text-[#1F2937]">{formatMonto(parseFloat(p.precioTotal))}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${badgePago(p.estadoPago)}`}>
                              {etiquetaPago[p.estadoPago]}
                            </span>
                          </div>

                          {p.montoSeña && p.estadoPago === 'señado' && (
                            <p className="text-xs text-[#6B7280]">
                              Seña: {formatMonto(parseFloat(p.montoSeña))} · Resta: {formatMonto(parseFloat(p.precioTotal) - parseFloat(p.montoSeña))}
                            </p>
                          )}

                          {cobrandoId === p.id && (
                            <div className="bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-2.5 flex flex-col gap-2.5">
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
                                <button type="button" onClick={() => { setCobrandoId(null); setCobrarMonto('') }}
                                  className="flex-1 py-2.5 text-sm text-[#6B7280] hover:text-[#1F2937] bg-white border border-[#E5EAF1] rounded-xl hover:bg-[#F7FAFC] transition-colors">
                                  Cancelar
                                </button>
                                <button type="button" disabled={!cobrarMonto || parseFloat(cobrarMonto) <= 0}
                                  onClick={() => handleCobrar(p)}
                                  className="flex-1 py-2.5 text-sm font-semibold bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
                                  Guardar
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 mt-auto pt-1">
                            <div className="flex gap-2">
                              <button onClick={() => setViewTarget(p)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#F7FAFC] border border-[#E5EAF1] text-[#1F2937] rounded-xl hover:bg-[#E5EAF1] transition-colors">
                                Ver
                              </button>
                              <button onClick={() => setConfirmEntregarTarget(p)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#fffbeb] text-[#b45309] rounded-xl hover:bg-[#fef3c7] transition-colors">
                                <PackageCheck size={14} strokeWidth={2} />
                                Entregar
                              </button>
                            </div>
                            {cobrandoId !== p.id && (
                              <div className="flex gap-2">
                                <button onClick={() => { setCobrandoId(p.id); setCobrarMonto('') }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#ecfdf5] text-[#047857] rounded-xl hover:bg-[#d1fae5] transition-colors">
                                  <Banknote size={14} strokeWidth={2} />
                                  Cobrar
                                </button>
                                <button onClick={() => setConfirmPagarTarget(p)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] transition-colors">
                                  <CheckCircle2 size={14} strokeWidth={2} />
                                  Pagado
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ── Sección: solo por entregar ── */}
              {pendientesEntregaSolo.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <PackageCheck size={14} color="#9CC6EA" strokeWidth={2} />
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Pendiente de entrega
                    </p>
                    <span className="ml-auto text-xs text-[#6B7280]">
                      {pendientesEntregaSolo.length} · {formatMonto(pendientesEntregaSolo.reduce((s, p) => s + parseFloat(p.precioTotal), 0))}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pendientesEntregaSolo.map(p => {
                      const tel = p.telefono ?? p.cliente?.telefono ?? null
                      return (
                        <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#1F2937] text-sm truncate">{p.nombreCliente}</p>
                                {p.modalidadEntrega && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.modalidadEntrega === 'ENVIO' ? 'bg-[#CFE6F7] text-[#1F2937]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                    {p.modalidadEntrega === 'ENVIO' ? 'Envío' : 'Retira'}
                                  </span>
                                )}
                              </div>
                              {p.evento && <p className="text-xs text-[#9CC6EA] font-medium truncate">{p.evento.nombre}</p>}
                              {p.fechaEntrega && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Calendar size={11} className={`shrink-0 ${esPasada(p.fechaEntrega) ? 'text-red-400' : 'text-[#9CC6EA]'}`} strokeWidth={2} />
                                  <span className={`text-xs font-medium ${esPasada(p.fechaEntrega) ? 'text-red-500' : 'text-[#6B7280]'}`}>
                                    {formatFechaCorta(p.fechaEntrega)}
                                  </span>
                                  {esHoy(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">Hoy</span>
                                  )}
                                  {esPasada(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full leading-none">Vencido</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {tel && (
                              <a href={toWhatsAppUrl(tel)} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-xl text-[#25D366] hover:bg-emerald-50 transition-colors shrink-0"
                                title={`WhatsApp ${tel}`}>
                                <WhatsAppIcon size={22} />
                              </a>
                            )}
                          </div>

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
                          {p.notas && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                              <StickyNote size={13} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                              <p className="text-xs text-amber-900 leading-relaxed font-medium">{p.notas}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xl font-bold text-[#1F2937]">{formatMonto(parseFloat(p.precioTotal))}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${badgePago(p.estadoPago)}`}>
                              {etiquetaPago[p.estadoPago]}
                            </span>
                          </div>

                          <div className="flex gap-2 mt-auto pt-1">
                            <button onClick={() => setViewTarget(p)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#F7FAFC] border border-[#E5EAF1] text-[#1F2937] rounded-xl hover:bg-[#E5EAF1] transition-colors">
                              Ver
                            </button>
                            <button onClick={() => setConfirmEntregarTarget(p)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#fffbeb] text-[#b45309] rounded-xl hover:bg-[#fef3c7] transition-colors">
                              <PackageCheck size={14} strokeWidth={2} />
                              Entregar
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ── Sección: solo por cobrar ── */}
              {pendientesCobroSolo.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Banknote size={14} color="#9CC6EA" strokeWidth={2} />
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Pendiente de cobro
                    </p>
                    <span className="ml-auto text-xs text-[#6B7280]">
                      {pendientesCobroSolo.length} · {formatMonto(pendientesCobroSolo.reduce((s, p) => s + parseFloat(p.precioTotal), 0))}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pendientesCobroSolo.map(p => {
                      const tel = p.telefono ?? p.cliente?.telefono ?? null
                      return (
                        <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#1F2937] text-sm truncate">{p.nombreCliente}</p>
                                {p.modalidadEntrega && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.modalidadEntrega === 'ENVIO' ? 'bg-[#CFE6F7] text-[#1F2937]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                                    {p.modalidadEntrega === 'ENVIO' ? 'Envío' : 'Retira'}
                                  </span>
                                )}
                              </div>
                              {p.evento && <p className="text-xs text-[#9CC6EA] font-medium truncate">{p.evento.nombre}</p>}
                              {p.fechaEntrega && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Calendar size={11} className={`shrink-0 ${esPasada(p.fechaEntrega) ? 'text-red-400' : 'text-[#9CC6EA]'}`} strokeWidth={2} />
                                  <span className={`text-xs font-medium ${esPasada(p.fechaEntrega) ? 'text-red-500' : 'text-[#6B7280]'}`}>
                                    {formatFechaCorta(p.fechaEntrega)}
                                  </span>
                                  {esHoy(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">Hoy</span>
                                  )}
                                  {esPasada(p.fechaEntrega) && (
                                    <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full leading-none">Vencido</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {tel && (
                              <a href={toWhatsAppUrl(tel)} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-xl text-[#25D366] hover:bg-emerald-50 transition-colors shrink-0"
                                title={`WhatsApp ${tel}`}>
                                <WhatsAppIcon size={22} />
                              </a>
                            )}
                          </div>

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
                          {p.notas && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                              <StickyNote size={13} className="text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
                              <p className="text-xs text-amber-900 leading-relaxed font-medium">{p.notas}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xl font-bold text-[#1F2937]">{formatMonto(parseFloat(p.precioTotal))}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${badgeEntrega(p.estadoEntrega)}`}>
                              {p.estadoEntrega === 'entregado' ? 'Entregado' : 'Sin entregar'}
                            </span>
                          </div>

                          {p.montoSeña && p.estadoPago === 'señado' && (
                            <p className="text-xs text-[#6B7280]">
                              Seña: {formatMonto(parseFloat(p.montoSeña))} · Resta: {formatMonto(parseFloat(p.precioTotal) - parseFloat(p.montoSeña))}
                            </p>
                          )}

                          {cobrandoId === p.id && (
                            <div className="bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-2.5 flex flex-col gap-2.5">
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
                                <button type="button" onClick={() => { setCobrandoId(null); setCobrarMonto('') }}
                                  className="flex-1 py-2.5 text-sm text-[#6B7280] hover:text-[#1F2937] bg-white border border-[#E5EAF1] rounded-xl hover:bg-[#F7FAFC] transition-colors">
                                  Cancelar
                                </button>
                                <button type="button" disabled={!cobrarMonto || parseFloat(cobrarMonto) <= 0}
                                  onClick={() => handleCobrar(p)}
                                  className="flex-1 py-2.5 text-sm font-semibold bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
                                  Guardar
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 mt-auto pt-1">
                            <button onClick={() => setViewTarget(p)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#F7FAFC] border border-[#E5EAF1] text-[#1F2937] rounded-xl hover:bg-[#E5EAF1] transition-colors">
                              Ver
                            </button>
                            {cobrandoId !== p.id && (
                              <button onClick={() => { setCobrandoId(p.id); setCobrarMonto('') }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#ecfdf5] text-[#047857] rounded-xl hover:bg-[#d1fae5] transition-colors">
                                <Banknote size={14} strokeWidth={2} />
                                Cobrar
                              </button>
                            )}
                            {cobrandoId !== p.id && (
                              <button onClick={() => setConfirmPagarTarget(p)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium bg-[#1F2937] text-white rounded-xl hover:bg-[#374151] transition-colors">
                                <CheckCircle2 size={14} strokeWidth={2} />
                                Pagado
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

            </div>
          )}
        </>
      )}

      {/* ════════════════ TAB FINANZAS ════════════════ */}
      {activeTab === 'finanzas' && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
              <BarChart2 size={16} color="#1F2937" strokeWidth={2} />
            </div>
            <h1 className="text-xl font-semibold text-[#1F2937]">Finanzas</h1>
          </div>

          {/* Period selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['semana', 'mes', 'anio', 'personalizado'] as Periodo[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodo === p ? 'bg-[#1F2937] text-white' : 'bg-white border border-[#E5EAF1] text-[#6B7280] hover:text-[#1F2937] hover:border-[#9CC6EA]'}`}
              >
                {periodoLabels[p]}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B7280] font-medium">Desde</label>
                <input
                  type="date"
                  value={customDesde}
                  onChange={e => setCustomDesde(e.target.value)}
                  className="border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B7280] font-medium">Hasta</label>
                <input
                  type="date"
                  value={customHasta}
                  onChange={e => setCustomHasta(e.target.value)}
                  className="border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] bg-white"
                />
              </div>
            </div>
          )}

          {loadingFinanzas ? (
            <LoadingSpinner />
          ) : resumen ? (
            <div className="flex flex-col gap-6">

              {/* ── Sección ingresos ── */}
              <section>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Ingresos</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Total esperado</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-2xl font-bold text-[#1F2937]">{formatMonto(resumen.totalIngresosEsperados)}</p>
                      <TrendBadge curr={resumen.totalIngresosEsperados} prev={resumen.periodoAnterior.totalIngresosEsperados} />
                    </div>
                    <p className="text-xs text-[#9CC6EA] mt-1">{resumen.cantidadPedidos} pedido{resumen.cantidadPedidos !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Total cobrado</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-2xl font-bold text-emerald-600">{formatMonto(resumen.totalIngresosCobrados)}</p>
                      <TrendBadge curr={resumen.totalIngresosCobrados} prev={resumen.periodoAnterior.totalIngresosCobrados} />
                    </div>
                    {resumen.totalIngresosEsperados > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-[#E5EAF1] rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (resumen.totalIngresosCobrados / resumen.totalIngresosEsperados) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {((resumen.totalIngresosCobrados / resumen.totalIngresosEsperados) * 100).toFixed(0)}% del esperado
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Pendiente de cobro</p>
                    <p className="text-2xl font-bold text-amber-500">
                      {formatMonto(resumen.totalIngresosEsperados - resumen.totalIngresosCobrados)}
                    </p>
                    {resumen.cantidadPedidosPendientes > 0 && (
                      <p className="text-xs text-[#9CC6EA] mt-1">
                        {resumen.cantidadPedidosPendientes} pedido{resumen.cantidadPedidosPendientes !== 1 ? 's' : ''} sin cobrar
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Sección gastos y margen ── */}
              <section>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Gastos y margen</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Total gastado</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-2xl font-bold text-rose-500">{formatMonto(resumen.totalGastos)}</p>
                      <TrendBadge curr={resumen.totalGastos} prev={resumen.periodoAnterior.totalGastos} positiveIsGood={false} />
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Margen neto</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className={`text-2xl font-bold ${resumen.margenNeto >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {formatMonto(resumen.margenNeto)}
                      </p>
                      <TrendBadge curr={resumen.margenNeto} prev={resumen.periodoAnterior.margenNeto} />
                    </div>
                    <p className="text-xs text-[#9CC6EA] mt-1">Cobrado − Gastado</p>
                  </div>
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Margen esperado</p>
                    <div className="flex items-end justify-between gap-2">
                      <p className={`text-2xl font-bold ${resumen.margenEsperado >= 0 ? 'text-[#1F2937]' : 'text-rose-500'}`}>
                        {formatMonto(resumen.margenEsperado)}
                      </p>
                      <TrendBadge curr={resumen.margenEsperado} prev={resumen.periodoAnterior.margenEsperado} />
                    </div>
                    <p className="text-xs text-[#9CC6EA] mt-1">Esperado − Gastado</p>
                  </div>
                </div>
              </section>

              {/* ── Gastos recientes ── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Gastos recientes</p>
                  <button
                    onClick={() => navigate('/gastos')}
                    className="text-xs text-[#9CC6EA] hover:text-[#1F2937] font-medium transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                {gastosRecientes.length === 0 ? (
                  <p className="text-sm text-[#6B7280] py-4">No hay gastos en este período.</p>
                ) : (
                  <div className="bg-white border border-[#E5EAF1] rounded-2xl overflow-hidden">
                    {gastosRecientes.map((g, idx) => (
                      <div key={g.id} className={`flex items-center gap-3 px-4 py-3 ${idx < gastosRecientes.length - 1 ? 'border-b border-[#E5EAF1]' : ''}`}>
                        <div className="w-7 h-7 rounded-lg bg-[#F7FAFC] border border-[#E5EAF1] flex items-center justify-center shrink-0">
                          <Receipt size={13} className="text-[#9CC6EA]" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] truncate">
                            {g.materiaPrima?.nombre ?? g.descripcion ?? '—'}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {new Date(g.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                            {g.evento && <span className="ml-1.5 text-[#9CC6EA]">· {g.evento.nombre}</span>}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-rose-500 shrink-0">{formatMonto(parseFloat(g.monto))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          ) : (
            periodo === 'personalizado' && (!customDesde || !customHasta) ? (
              <p className="text-sm text-[#6B7280] py-4">Seleccioná un rango de fechas para ver el resumen.</p>
            ) : null
          )}
        </>
      )}

      {/* Modales */}
      <PedidoDetailModal
        pedido={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); setModalOpen(true) }}
      />

      <PedidoFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={(pedido) => { setModalOpen(false); setEditTarget(null); loadPedidos(); if (pedido) setViewTarget(pedido) }}
        editTarget={editTarget}
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
    </div>
  )
}
