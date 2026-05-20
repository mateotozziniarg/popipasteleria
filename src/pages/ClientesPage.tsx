import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2, Phone, MapPin } from 'lucide-react'
import { Cliente, getClientes, createCliente, updateCliente, deleteCliente } from '../api/clientes'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

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

  async function handleDelete(c: Cliente) {
    if (!confirm(`¿Eliminar a "${c.nombre}"?`)) return
    try {
      await deleteCliente(c.id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar')
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
        <div className="text-center py-16 text-[#6B7280]">
          <Users size={32} className="mx-auto mb-3 text-[#E5EAF1]" strokeWidth={1.5} />
          <p className="text-base font-medium">No hay clientes todavía.</p>
          <p className="text-sm mt-1">Creá el primero para empezar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map(c => (
            <div key={c.id} className="bg-white border border-[#E5EAF1] rounded-2xl px-5 py-4 hover:border-[#9CC6EA] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1F2937]">{c.nombre}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {c.telefono && (
                      <a
                        href={`tel:${c.telefono}`}
                        className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone size={11} strokeWidth={2} />
                        {c.telefono}
                      </a>
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
                    onClick={() => handleDelete(c)}
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
