import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Phone, MapPin } from 'lucide-react'

function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
import { Cliente, getClientes, createCliente, updateCliente, deleteCliente } from '../api/clientes'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'

interface FormState {
  nombre: string
  telefono: string
  direccion: string
  notas: string
}

const emptyForm: FormState = { nombre: '', telefono: '', direccion: '', notas: '' }

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors'
const labelClass = 'block text-sm font-medium text-[#1F2937] mb-1.5'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setClientes(await getClientes())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditTarget(c)
    setForm({
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      direccion: c.direccion ?? '',
      notas: c.notas ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  async function execDelete() {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteCliente(confirmTarget.id)
      setConfirmTarget(null)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const data = {
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined,
        notas: form.notas || undefined,
      }
      if (editTarget) {
        await updateCliente(editTarget.id, data)
      } else {
        await createCliente(data)
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
            <Users size={16} color="#1F2937" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Clientes</h1>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Nuevo cliente
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : clientes.length === 0 ? (
        <EmptyState
          variant="clientes"
          titulo="Todavía no hay clientes"
          descripcion="Registrá tus clientes para asociarlos a los pedidos fácilmente."
          accion={
            <button onClick={openCreate} className="bg-[#1F2937] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#374151] transition-colors">
              Agregar primer cliente
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map(c => (
            <div key={c.id} className="bg-white border border-[#E5EAF1] rounded-2xl px-5 py-4 hover:border-[#9CC6EA] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1F2937]">{c.nombre}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {c.telefono && (
                      <>
                        <a
                          href={`tel:${c.telefono}`}
                          className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <Phone size={11} strokeWidth={2} />
                          {c.telefono}
                        </a>
                        <a
                          href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#25D366] hover:text-[#128C7E] transition-colors font-medium"
                          onClick={e => e.stopPropagation()}
                        >
                          <WhatsAppIcon />
                          WhatsApp
                        </a>
                      </>
                    )}
                    {c.direccion && (
                      <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <MapPin size={11} strokeWidth={2} />
                        {c.direccion}
                      </span>
                    )}
                  </div>
                  {c.notas && (
                    <p className="text-xs text-[#6B7280] mt-1 italic">{c.notas}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors px-2 py-1 rounded-lg hover:bg-[#F7FAFC]"
                  >
                    <Pencil size={12} strokeWidth={2} />
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmTarget(c)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmTarget !== null}
        titulo={`¿Eliminar a "${confirmTarget?.nombre}"?`}
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Borrar"
        onConfirmar={execDelete}
        onCancelar={() => setConfirmTarget(null)}
        loading={deleting}
      />

      {modalOpen && (
        <Modal title={editTarget ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                autoFocus
                className={inputClass}
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: María García"
              />
            </div>
            <div>
              <label className={labelClass}>
                Teléfono <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <input
                className={inputClass}
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                placeholder="11 1234-5678"
              />
            </div>
            <div>
              <label className={labelClass}>
                Dirección <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <input
                className={inputClass}
                value={form.direccion}
                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Ej: Av. Corrientes 1234"
              />
            </div>
            <div>
              <label className={labelClass}>
                Notas <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Sin TACC, alérgico a..."
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>Cancelar</button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? <><LoadingSpinner inline /><span>Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
