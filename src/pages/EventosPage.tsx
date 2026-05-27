import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, Pencil, Trash2, ChevronRight, ShoppingCart } from 'lucide-react'
import { Evento, getEventos, createEvento, updateEvento, deleteEvento } from '../api/eventos'
import { getPedidos, Pedido } from '../api/pedidos'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'

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

const inputClass = 'w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm text-[#2A1F1A] placeholder-[#7A6A5A] focus:outline-none focus:ring-2 focus:ring-[#B5A28A] focus:border-[#B5A28A] transition-colors'
const labelClass = 'block text-sm font-medium text-[#2A1F1A] mb-1.5'
const btnPrimary = 'bg-[#2A1F1A] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#1A1310] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#7A6A5A] hover:text-[#2A1F1A] transition-colors'

export default function EventosPage() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<EventoConResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Evento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<Evento | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function handleDelete(ev: Evento, e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmTarget(ev)
  }

  async function execDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteEvento(confirmTarget.id)
      setConfirmTarget(null)
      loadEventos()
    } finally {
      setDeleting(false)
    }
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
    new Date(iso.substring(0,10) + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatMonto = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F1E4CC] flex items-center justify-center">
            <Calendar size={16} color="#2A1F1A" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#2A1F1A]">Eventos</h1>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Nuevo evento
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : eventos.length === 0 ? (
        <EmptyState
          variant="eventos"
          titulo="Todavía no hay eventos"
          descripcion="Creá tu primer evento para empezar a organizar pedidos y tortas."
          accion={
            <button onClick={openCreate} className="bg-[#2A1F1A] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#1A1310] transition-colors">
              Crear primer evento
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {eventos.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/eventos/${ev.id}`)}
              className="bg-white border border-[#E2D9CC] rounded-2xl px-5 py-4 cursor-pointer hover:border-[#B5A28A] hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#2A1F1A] truncate">{ev.nombre}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar size={12} color="#B5A28A" strokeWidth={2} />
                    <p className="text-xs text-[#7A6A5A]">{formatFecha(ev.fecha)}</p>
                  </div>
                  {ev.descripcion && (
                    <p className="text-sm text-[#7A6A5A] mt-1.5 truncate">{ev.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2A1F1A]">{formatMonto(ev.montoTotal)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <ShoppingCart size={11} color="#B5A28A" strokeWidth={2} />
                      <p className="text-xs text-[#7A6A5A]">
                        {ev.totalPedidos} {ev.totalPedidos === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#E2D9CC" strokeWidth={2} className="group-hover:text-[#B5A28A] transition-colors" />
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#E2D9CC]">
                <button
                  onClick={(e) => openEdit(ev, e)}
                  className="flex items-center gap-1.5 text-xs text-[#7A6A5A] hover:text-[#2A1F1A] transition-colors px-2 py-1 rounded-lg hover:bg-[#FBF6EC]"
                >
                  <Pencil size={12} strokeWidth={2} />
                  Editar
                </button>
                <button
                  onClick={(e) => handleDelete(ev, e)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={12} strokeWidth={2} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmTarget !== null}
        titulo={`¿Eliminar "${confirmTarget?.nombre}"?`}
        descripcion="También se eliminarán todos sus pedidos. Esta acción no se puede deshacer."
        labelConfirmar="Borrar evento"
        onConfirmar={execDelete}
        onCancelar={() => setConfirmTarget(null)}
        loading={deleting}
      />

      {modalOpen && (
        <Modal title={editTarget ? 'Editar evento' : 'Nuevo evento'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Casamiento García"
              />
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                className={inputClass}
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>
                Descripción <span className="text-[#7A6A5A] font-normal">(opcional)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? <><LoadingSpinner inline /><span>Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
