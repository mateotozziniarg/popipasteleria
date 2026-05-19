import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Evento, getEventos } from '../api/eventos'
import {
  Pedido, PedidoInput, EstadoEntrega, EstadoPago,
  getPedidos, createPedido, updatePedido, deletePedido,
} from '../api/pedidos'
import Modal from '../components/Modal'

interface PedidoFormState {
  nombreCliente: string
  telefono: string
  descripcion: string
  precioTotal: string
  estadoEntrega: EstadoEntrega
  estadoPago: EstadoPago
  notas: string
}

const emptyPedidoForm: PedidoFormState = {
  nombreCliente: '',
  telefono: '',
  descripcion: '',
  precioTotal: '',
  estadoEntrega: 'pendiente',
  estadoPago: 'sin_seña',
  notas: '',
}

const etiquetaEntrega: Record<EstadoEntrega, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
}

const etiquetaPago: Record<EstadoPago, string> = {
  sin_seña: 'Sin seña',
  señado: 'Señado',
  pagado: 'Pagado',
}

const badgeEntrega = (estado: EstadoEntrega) =>
  estado === 'entregado'
    ? 'bg-green-100 text-green-700'
    : 'bg-yellow-100 text-yellow-700'

const badgePago = (estado: EstadoPago) => {
  if (estado === 'pagado') return 'bg-green-100 text-green-700'
  if (estado === 'señado') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  const eventoId = parseInt(id!)
  const navigate = useNavigate()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pedido | null>(null)
  const [form, setForm] = useState<PedidoFormState>(emptyPedidoForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [evs, peds] = await Promise.all([getEventos(), getPedidos(eventoId)])
      const ev = evs.find(e => e.id === eventoId) ?? null
      setEvento(ev)
      setPedidos(peds)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [eventoId])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyPedidoForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(p: Pedido) {
    setEditTarget(p)
    setForm({
      nombreCliente: p.nombreCliente,
      telefono: p.telefono ?? '',
      descripcion: p.descripcion,
      precioTotal: p.precioTotal,
      estadoEntrega: p.estadoEntrega,
      estadoPago: p.estadoPago,
      notas: p.notas ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este pedido?')) return
    await deletePedido(id)
    load()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombreCliente || !form.descripcion || !form.precioTotal) {
      setError('Cliente, descripción y precio son requeridos')
      return
    }
    setSaving(true)
    setError('')
    const payload: PedidoInput = {
      nombreCliente: form.nombreCliente,
      telefono: form.telefono || undefined,
      descripcion: form.descripcion,
      precioTotal: parseFloat(form.precioTotal),
      estadoEntrega: form.estadoEntrega,
      estadoPago: form.estadoPago,
      notas: form.notas || undefined,
    }
    try {
      if (editTarget) {
        await updatePedido(editTarget.id, payload)
      } else {
        await createPedido(eventoId, payload)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const formatMonto = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  // Dashboard
  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos
    .filter(p => p.estadoPago === 'pagado')
    .reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pagados = pedidos.filter(p => p.estadoPago === 'pagado').length

  if (loading) return <p className="p-6 text-sm text-gray-500">Cargando...</p>
  if (!evento) return <p className="p-6 text-sm text-red-500">Evento no encontrado.</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
        ← Eventos
      </button>

      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">{evento.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatFecha(evento.fecha)}</p>
        {evento.descripcion && <p className="text-sm text-gray-400 mt-1">{evento.descripcion}</p>}
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pedidos</p>
          <p className="text-2xl font-semibold text-gray-900">{pedidos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Entregados</p>
          <p className="text-2xl font-semibold text-gray-900">{entregados}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Monto total</p>
          <p className="text-lg font-semibold text-gray-900">{formatMonto(totalMonto)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Cobrado</p>
          <p className="text-lg font-semibold text-green-600">{formatMonto(cobrado)}</p>
          <p className="text-xs text-gray-400">{pagados} pagados</p>
        </div>
      </div>

      {/* Pedidos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-800">Pedidos</h2>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No hay pedidos para este evento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.nombreCliente}</p>
                  {p.telefono && <p className="text-xs text-gray-400 mt-0.5">{p.telefono}</p>}
                  <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>
                  {p.notas && <p className="text-xs text-gray-400 mt-1 italic">{p.notas}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {formatMonto(parseFloat(p.precioTotal))}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeEntrega(p.estadoEntrega)}`}>
                    {etiquetaEntrega[p.estadoEntrega]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgePago(p.estadoPago)}`}>
                    {etiquetaPago[p.estadoPago]}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editTarget ? 'Editar pedido' : 'Nuevo pedido'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.nombreCliente}
                  onChange={e => setForm(f => ({ ...f, nombreCliente: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="11 1234-5678"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio total</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.precioTotal}
                  onChange={e => setForm(f => ({ ...f, precioTotal: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del pedido</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  rows={2}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Torta de chocolate 3 pisos, 30 porciones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado entrega</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.estadoEntrega}
                  onChange={e => setForm(f => ({ ...f, estadoEntrega: e.target.value as EstadoEntrega }))}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado pago</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.estadoPago}
                  onChange={e => setForm(f => ({ ...f, estadoPago: e.target.value as EstadoPago }))}
                >
                  <option value="sin_seña">Sin seña</option>
                  <option value="señado">Señado</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  rows={2}
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Sin gluten, entrega a domicilio, etc."
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-900">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Crear pedido'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
