import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Evento, getEventos, createEvento, updateEvento, deleteEvento } from '../api/eventos'
import { getPedidos, Pedido } from '../api/pedidos'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

interface EventoConResumen extends Evento {
  totalPedidos: number
  montoTotal: number
}

interface FormState {
  nombre: string
  fecha: string
  descripcion: string
}

const emptyForm: FormState = { nombre: '', fecha: '', descripcion: '' }

export default function EventosPage() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<EventoConResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Evento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadEventos() {
    setLoading(true)
    try {
      const evs = await getEventos()
      const conResumen: EventoConResumen[] = await Promise.all(
        evs.map(async (ev) => {
          let pedidos: Pedido[] = []
          try { pedidos = await getPedidos(ev.id) } catch { /* ok */ }
          const montoTotal = pedidos.reduce((sum, p) => sum + parseFloat(p.precioTotal), 0)
          return { ...ev, totalPedidos: pedidos.length, montoTotal }
        })
      )
      setEventos(conResumen)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEventos() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(ev: Evento, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTarget(ev)
    setForm({ nombre: ev.nombre, fecha: ev.fecha.slice(0, 10), descripcion: ev.descripcion ?? '' })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este evento? También se eliminarán sus pedidos.')) return
    await deleteEvento(id)
    loadEventos()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.fecha) { setError('Nombre y fecha son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      if (editTarget) {
        await updateEvento(editTarget.id, form)
      } else {
        await createEvento(form)
      }
      setModalOpen(false)
      loadEventos()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatMonto = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

  return (
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Eventos</h1>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo evento
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base">No hay eventos todavía.</p>
          <p className="text-sm mt-1">Creá el primero para empezar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {eventos.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/eventos/${ev.id}`)}
              className="bg-white border border-gray-200 rounded-xl px-5 py-4 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ev.nombre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatFecha(ev.fecha)}</p>
                  {ev.descripcion && (
                    <p className="text-sm text-gray-400 mt-1 truncate">{ev.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">{formatMonto(ev.montoTotal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ev.totalPedidos} {ev.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => openEdit(ev, e)}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => handleDelete(ev.id, e)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editTarget ? 'Editar evento' : 'Nuevo evento'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Casamiento García"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                rows={2}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
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
                {saving ? <><LoadingSpinner inline /> <span className="ml-1.5">Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
