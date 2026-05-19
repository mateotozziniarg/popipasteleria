import { useEffect, useState } from 'react'
import { PedidoConEvento, FiltrosPedidos, EstadoEntrega, EstadoPago, getPedidosGlobal } from '../api/pedidos'
import { Evento, getEventos } from '../api/eventos'
import LoadingSpinner from '../components/LoadingSpinner'

type Modo = 'tabla' | 'dashboard'

const etiquetaEntrega: Record<EstadoEntrega, string> = { pendiente: 'Pendiente', entregado: 'Entregado' }
const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Sin seña', señado: 'Señado', pagado: 'Pagado' }

const badgeEntrega = (e: EstadoEntrega) =>
  e === 'entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'

const badgePago = (e: EstadoPago) =>
  e === 'pagado' ? 'bg-green-100 text-green-700' : e === 'señado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function PedidosPage() {
  const [modo, setModo] = useState<Modo>('tabla')
  const [pedidos, setPedidos] = useState<PedidoConEvento[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosPedidos>({})

  async function load() {
    setLoading(true)
    try {
      const [peds, evs] = await Promise.all([getPedidosGlobal(filtros), getEventos()])
      setPedidos(peds)
      setEventos(evs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [JSON.stringify(filtros)])

  function setFiltro<K extends keyof FiltrosPedidos>(key: K, value: FiltrosPedidos[K]) {
    setFiltros(f => ({ ...f, [key]: value || undefined }))
  }

  // Métricas dashboard
  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const pendienteCobro = totalMonto - cobrado
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pendientesEntrega = pedidos.filter(p => p.estadoEntrega === 'pendiente').length

  const porEstadoPago = (['sin_seña', 'señado', 'pagado'] as EstadoPago[]).map(estado => ({
    estado,
    cantidad: pedidos.filter(p => p.estadoPago === estado).length,
    monto: pedidos.filter(p => p.estadoPago === estado).reduce((s, p) => s + parseFloat(p.precioTotal), 0),
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 pt-16 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pedidos</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setModo('tabla')}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${modo === 'tabla' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Tabla
          </button>
          <button
            onClick={() => setModo('dashboard')}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${modo === 'dashboard' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Evento</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={filtros.eventoId ?? ''}
            onChange={e => setFiltro('eventoId', e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="">Todos</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Entrega</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={filtros.estadoEntrega ?? ''}
            onChange={e => setFiltro('estadoEntrega', e.target.value as EstadoEntrega || undefined)}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pago</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={filtros.estadoPago ?? ''}
            onChange={e => setFiltro('estadoPago', e.target.value as EstadoPago || undefined)}
          >
            <option value="">Todos</option>
            <option value="sin_seña">Sin seña</option>
            <option value="señado">Señado</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label className="block text-xs font-medium text-gray-500">Fecha evento</label>
          <div className="flex gap-1 items-center">
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={filtros.fechaDesde ?? ''}
              onChange={e => setFiltro('fechaDesde', e.target.value || undefined)}
            />
            <span className="text-gray-400 text-xs shrink-0">–</span>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
              value={filtros.fechaHasta ?? ''}
              onChange={e => setFiltro('fechaHasta', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : modo === 'tabla' ? (
        /* ── MODO TABLA ── */
        pedidos.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No hay pedidos con esos filtros.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-left px-4 py-3">Evento</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Descripción</th>
                    <th className="text-right px-4 py-3">Precio</th>
                    <th className="text-left px-4 py-3">Entrega</th>
                    <th className="text-left px-4 py-3">Pago</th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pedidos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{p.nombreCliente}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <div>{p.evento.nombre}</div>
                        <div className="text-xs text-gray-400">{formatFecha(p.evento.fecha)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-48 hidden md:table-cell">
                        <p className="truncate">{p.descripcion}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {formatMonto(parseFloat(p.precioTotal))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeEntrega(p.estadoEntrega)}`}>
                          {etiquetaEntrega[p.estadoEntrega]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgePago(p.estadoPago)}`}>
                          {etiquetaPago[p.estadoPago]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-36 hidden lg:table-cell">
                        <p className="truncate italic">{p.notas ?? '—'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ── MODO DASHBOARD ── */
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Total pedidos</p>
              <p className="text-2xl font-semibold text-gray-900">{pedidos.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Monto esperado</p>
              <p className="text-lg font-semibold text-gray-900">{formatMonto(totalMonto)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Cobrado</p>
              <p className="text-lg font-semibold text-green-600">{formatMonto(cobrado)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Pendiente cobro</p>
              <p className="text-lg font-semibold text-orange-500">{formatMonto(pendienteCobro)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-4">Estado de entrega</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                  <span className="text-sm font-semibold text-gray-900">{pendientesEntrega}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Entregado</span>
                  <span className="text-sm font-semibold text-gray-900">{entregados}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-4">Estado de pago</p>
              <div className="flex flex-col gap-3">
                {porEstadoPago.map(({ estado, cantidad, monto }) => (
                  <div key={estado} className="flex items-center justify-between">
                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${badgePago(estado)}`}>
                      {etiquetaPago[estado]}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{cantidad}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatMonto(monto)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
