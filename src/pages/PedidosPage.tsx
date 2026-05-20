import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, LayoutList, BarChart2, CheckCircle2, Clock, CreditCard,
  TrendingDown, TrendingUp, DollarSign, SlidersHorizontal, FlaskConical, Plus, Search, Eye, Pencil
} from 'lucide-react'
import { PedidoConEvento, FiltrosPedidos, EstadoEntrega, EstadoPago, getPedidosGlobal } from '../api/pedidos'
import { Evento, getEventos } from '../api/eventos'
import { getGastosTotal } from '../api/materiasPrimas'
import LoadingSpinner from '../components/LoadingSpinner'
import PedidoFormModal from '../components/PedidoFormModal'
import PedidoDetailModal from '../components/PedidoDetailModal'
import EmptyState from '../components/EmptyState'

type Modo = 'tabla' | 'dashboard'

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

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'

export default function PedidosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modo, setModo] = useState<Modo>('tabla')
  const [pedidos, setPedidos] = useState<PedidoConEvento[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosPedidos>({})
  const [eventoSelect, setEventoSelect] = useState('')
  const [totalGastosGlobal, setTotalGastosGlobal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PedidoConEvento | null>(null)
  const [viewTarget, setViewTarget] = useState<PedidoConEvento | null>(null)

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

  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const pendienteCobro = totalMonto - cobrado
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pendientesEntrega = pedidos.filter(p => p.estadoEntrega === 'pendiente').length
  const gananciaNeta = cobrado - totalGastosGlobal
  const gananciaEsperada = totalMonto - totalGastosGlobal
  const sinEventoCantidad = pedidos.filter(p => !p.eventoId).length
  const sinEventoMonto = pedidos.filter(p => !p.eventoId).reduce((s, p) => s + parseFloat(p.precioTotal), 0)

  const porEstadoPago = (['sin_seña', 'señado', 'pagado'] as EstadoPago[]).map(estado => ({
    estado,
    cantidad: pedidos.filter(p => p.estadoPago === estado).length,
    monto: pedidos.filter(p => p.estadoPago === estado).reduce((s, p) => s + parseFloat(p.precioTotal), 0),
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
            <ShoppingCart size={16} color="#1F2937" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Pedidos</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalOpen(true)} className={btnPrimary}>
            <Plus size={14} strokeWidth={2.5} /> Nuevo pedido
          </button>
          <div className="flex gap-1 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl p-1">
            <button onClick={() => setModo('tabla')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${modo === 'tabla' ? 'bg-white shadow-sm font-medium text-[#1F2937] border border-[#E5EAF1]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
              <LayoutList size={14} strokeWidth={2} /> Tabla
            </button>
            <button onClick={() => setModo('dashboard')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${modo === 'dashboard' ? 'bg-white shadow-sm font-medium text-[#1F2937] border border-[#E5EAF1]' : 'text-[#6B7280] hover:text-[#1F2937]'}`}>
              <BarChart2 size={14} strokeWidth={2} /> Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-1.5 mb-3">
          <SlidersHorizontal size={13} color="#9CC6EA" strokeWidth={2} />
          <span className="text-xs font-medium text-[#6B7280]">Filtros</span>
        </div>
        <div className="flex flex-col gap-3">
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
      </div>

      {loading ? (
        <LoadingSpinner />
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
        onSaved={() => { setModalOpen(false); setEditTarget(null); load() }}
        editTarget={editTarget}
      />

      <PedidoDetailModal
        pedido={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); setModalOpen(true) }}
      />
    </div>
  )
}
