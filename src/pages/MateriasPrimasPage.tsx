import { useEffect, useState } from 'react'
import { FlaskConical, Plus, Pencil, Trash2 } from 'lucide-react'
import { MateriaPrima, getMateriasPrimas, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima } from '../api/materiasPrimas'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

interface FormState {
  nombre: string
  descripcion: string
  precioDefault: string
}

const emptyForm: FormState = { nombre: '', descripcion: '', precioDefault: '' }

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors'
const labelClass = 'block text-sm font-medium text-[#1F2937] mb-1.5'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors'

export default function MateriasPrimasPage() {
  const [materias, setMaterias] = useState<MateriaPrima[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MateriaPrima | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setMaterias(await getMateriasPrimas())
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

  function openEdit(m: MateriaPrima) {
    setEditTarget(m)
    setForm({ nombre: m.nombre, descripcion: m.descripcion ?? '', precioDefault: m.precioDefault })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(m: MateriaPrima) {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return
    try {
      await deleteMateriaPrima(m.id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al eliminar')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.precioDefault) { setError('Nombre y precio son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      const precio = parseFloat(form.precioDefault)
      if (editTarget) {
        await updateMateriaPrima(editTarget.id, { nombre: form.nombre, descripcion: form.descripcion || undefined, precioDefault: precio })
      } else {
        await createMateriaPrima({ nombre: form.nombre, descripcion: form.descripcion || undefined, precioDefault: precio })
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
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
            <FlaskConical size={16} color="#1F2937" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Materias primas</h1>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Nueva materia prima
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : materias.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <FlaskConical size={32} className="mx-auto mb-3 text-[#E5EAF1]" strokeWidth={1.5} />
          <p className="text-base font-medium">No hay materias primas todavía.</p>
          <p className="text-sm mt-1">Creá la primera para empezar.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5EAF1] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5EAF1] text-xs text-[#6B7280] font-medium">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Descripción</th>
                <th className="text-right px-4 py-3">Precio default</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7FAFC]">
              {materias.map(m => (
                <tr key={m.id} className="hover:bg-[#F7FAFC] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1F2937]">{m.nombre}</td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell">{m.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1F2937] whitespace-nowrap">
                    {formatMonto(parseFloat(m.precioDefault))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openEdit(m)}
                        className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors px-2 py-1 rounded-lg hover:bg-[#F7FAFC]"
                      >
                        <Pencil size={12} strokeWidth={2} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={12} strokeWidth={2} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editTarget ? 'Editar materia prima' : 'Nueva materia prima'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Harina 000"
              />
            </div>
            <div>
              <label className={labelClass}>
                Descripción <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <input
                className={inputClass}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: 25kg por bolsa"
              />
            </div>
            <div>
              <label className={labelClass}>Precio por defecto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.precioDefault}
                onChange={e => setForm(f => ({ ...f, precioDefault: e.target.value }))}
                placeholder="0"
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
