import { useEffect, useState } from 'react'
import { Zap, Banknote, PackageCheck, CheckCircle2, StickyNote, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { PedidoConEvento, EstadoPago, getPedidosGlobal, updatePedido } from '../api/pedidos'
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

// ── main component ─────────────────────────────────────────────────

export default function WorkspacePage() {
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

  async function load() {
    setLoading(true)
    try {
      setPedidos(await getPedidosGlobal({}))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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

  const pendientesEntrega = pedidos
    .filter(p => p.estadoEntrega === 'pendiente')
    .sort((a, b) => {
      if (a.fechaEntrega && b.fechaEntrega) return a.fechaEntrega.localeCompare(b.fechaEntrega)
      if (a.fechaEntrega && !b.fechaEntrega) return -1
      if (!a.fechaEntrega && b.fechaEntrega) return 1
      return 0
    })
  const pendientesCobro = pedidos.filter(p => p.estadoPago !== 'pagado')
  const enviosPendientes = pendientesEntrega.filter(p => p.modalidadEntrega === 'ENVIO').length
  const allClear = !loading && pendientesEntrega.length === 0 && pendientesCobro.length === 0

  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoyCapitalizado = hoy.charAt(0).toUpperCase() + hoy.slice(1)

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
          <Zap size={16} color="#1F2937" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Buen día</h1>
          <p className="text-xs text-[#6B7280]">{hoyCapitalizado}</p>
        </div>
        {!loading && (pendientesEntrega.length > 0 || pendientesCobro.length > 0) && (
          <div className="ml-auto flex gap-2">
            {pendientesEntrega.length > 0 && (
              <span className="text-xs bg-[#fffbeb] text-[#b45309] px-2.5 py-1 rounded-full font-medium">
                {pendientesEntrega.length} por entregar
              </span>
            )}
            {enviosPendientes > 0 && (
              <span className="text-xs bg-[#CFE6F7] text-[#1F2937] px-2.5 py-1 rounded-full font-medium">
                {enviosPendientes} {enviosPendientes === 1 ? 'envío' : 'envíos'}
              </span>
            )}
            {pendientesCobro.length > 0 && (
              <span className="text-xs bg-[#ecfdf5] text-[#047857] px-2.5 py-1 rounded-full font-medium">
                {pendientesCobro.length} por cobrar
              </span>
            )}
          </div>
        )}
      </div>

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

          {/* ── Sección: por entregar ── */}
          {pendientesEntrega.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <PackageCheck size={14} color="#9CC6EA" strokeWidth={2} />
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Pendiente de entrega
                </p>
                <span className="ml-auto text-xs text-[#6B7280]">
                  {pendientesEntrega.length} · {formatMonto(pendientesEntrega.reduce((s, p) => s + parseFloat(p.precioTotal), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pendientesEntrega.map(p => {
                  const tel = p.telefono ?? p.cliente?.telefono ?? null
                  return (
                    <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-3 flex flex-col gap-2">
                      {/* Header */}
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

                      {/* Precio + badge pago */}
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

                      {/* Acciones */}
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

          {/* ── Sección: por cobrar ── */}
          {pendientesCobro.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Banknote size={14} color="#9CC6EA" strokeWidth={2} />
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Pendiente de cobro
                </p>
                <span className="ml-auto text-xs text-[#6B7280]">
                  {pendientesCobro.length} · {formatMonto(pendientesCobro.reduce((s, p) => s + parseFloat(p.precioTotal), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pendientesCobro.map(p => {
                  const tel = p.telefono ?? p.cliente?.telefono ?? null
                  return (
                    <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl p-3 flex flex-col gap-2">
                      {/* Header */}
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

                      {/* Precio + badge entrega */}
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

                      {/* Cobrar inline */}
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

                      {/* Acciones */}
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

      {/* Modales */}
      <PedidoDetailModal
        pedido={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); setModalOpen(true) }}
      />

      <PedidoFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={(pedido) => { setModalOpen(false); setEditTarget(null); load(); if (pedido) setViewTarget(pedido) }}
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
