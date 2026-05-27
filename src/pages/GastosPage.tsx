import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Receipt, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { Gasto, getGastos, createGasto, updateGasto, deleteGasto } from '../api/gastos'
import { MateriaPrima, getMateriasPrimas, createMateriaPrima } from '../api/materiasPrimas'
import { Evento, getEventos } from '../api/eventos'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Buscador de materias primas (para el modal de gastos) ──────────
interface BuscadorMpSimpleProps {
  materias: MateriaPrima[]
  value: MateriaPrima | null
  onChange: (mp: MateriaPrima | null) => void
  onCrearNueva: (nombre: string) => void
}

function BuscadorMpSimple({ materias, value, onChange, onCrearNueva }: BuscadorMpSimpleProps) {
  const [query, setQuery] = useState(value?.nombre ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value?.nombre ?? '')
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtradas = materias.filter(m => m.nombre.toLowerCase().includes(query.toLowerCase()))
  const mostrarCrear = query.trim().length > 0 && !materias.some(m => m.nombre.toLowerCase() === query.trim().toLowerCase())

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm text-[#2A1F1A] focus:outline-none focus:ring-2 focus:ring-[#B5A28A] transition-colors"
        placeholder="Buscar o escribir nombre..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(null) }}
        onFocus={() => setOpen(true)}
      />
      {value && (
        <button type="button" onClick={() => { onChange(null); setQuery('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B5A28A] hover:text-[#7A6A5A] text-xs">✕</button>
      )}
      {open && (filtradas.length > 0 || mostrarCrear) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E2D9CC] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtradas.map(m => (
            <button key={m.id} type="button"
              onClick={() => { onChange(m); setQuery(m.nombre); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#FBF6EC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#2A1F1A]">{m.nombre}</span>
              <span className="text-[#7A6A5A] text-xs">{formatMonto(parseFloat(m.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button type="button"
              onClick={() => { onCrearNueva(query.trim()); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#B5A28A] hover:bg-[#FBF6EC] border-t border-[#E2D9CC] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} /> Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form crear materia prima inline ─────────────────────────
function MiniCrearMp({ nombre, onConfirmar, onCancelar }: { nombre: string; onConfirmar: (mp: MateriaPrima) => void; onCancelar: () => void }) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!precio) return
    setSaving(true)
    try { onConfirmar(await createMateriaPrima({ nombre, precioDefault: parseFloat(precio) })) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-[#FBF6EC] border border-[#F1E4CC] rounded-xl p-3 mt-1">
      <p className="text-sm font-medium text-[#2A1F1A] mb-2.5">Crear "{nombre}"</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[#7A6A5A] mb-1">Precio por defecto</label>
          <input type="number" min="0" step="0.01" autoFocus placeholder="0"
            className="w-full border border-[#E2D9CC] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A]"
            value={precio} onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrear() } }}
          />
        </div>
        <button type="button" disabled={saving || !precio} onClick={handleCrear}
          className="bg-[#2A1F1A] text-white text-xs px-3 py-2.5 rounded-xl hover:bg-[#1A1310] disabled:opacity-40 transition-colors">
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-[#7A6A5A] hover:text-[#2A1F1A] px-2 py-2">Cancelar</button>
      </div>
    </div>
  )
}

// ── Modal crear/editar gasto ──────────────────────────────────────
interface GastoFormData {
  fecha: string
  monto: string
  materiaPrima: MateriaPrima | null
  descripcion: string
  eventoId: string
  notas: string
}

interface GastoModalProps {
  isOpen: boolean
  editTarget: Gasto | null
  materias: MateriaPrima[]
  eventos: Evento[]
  onClose: () => void
  onSaved: () => void
  onNuevaMateria: (mp: MateriaPrima) => void
}

function GastoModal({ isOpen, editTarget, materias, eventos, onClose, onSaved, onNuevaMateria }: GastoModalProps) {
  const [form, setForm] = useState<GastoFormData>({
    fecha: getTodayStr(), monto: '', materiaPrima: null, descripcion: '', eventoId: '', notas: '',
  })
  const [crearMpNombre, setCrearMpNombre] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (editTarget) {
      const mp = editTarget.materiaPrima
        ? materias.find(m => m.id === editTarget.materiaPrimaId) ?? null
        : null
      setForm({
        fecha: editTarget.fecha.substring(0, 10),
        monto: parseFloat(editTarget.monto).toString(),
        materiaPrima: mp,
        descripcion: editTarget.descripcion ?? '',
        eventoId: editTarget.eventoId ? String(editTarget.eventoId) : '',
        notas: editTarget.notas ?? '',
      })
    } else {
      setForm({ fecha: getTodayStr(), monto: '', materiaPrima: null, descripcion: '', eventoId: '', notas: '' })
    }
    setCrearMpNombre(null)
  }, [isOpen, editTarget])

  function setField<K extends keyof GastoFormData>(k: K, v: GastoFormData[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(form.monto)
    if (!form.fecha || isNaN(montoNum) || montoNum <= 0) {
      toast.error('Fecha y monto son requeridos')
      return
    }
    if (!form.materiaPrima && !form.descripcion.trim()) {
      toast.error('Ingresá una materia prima o una descripción')
      return
    }
    setSaving(true)
    try {
      const payload = {
        fecha: form.fecha,
        monto: montoNum,
        materiaPrimaId: form.materiaPrima?.id ?? null,
        descripcion: form.descripcion.trim() || undefined,
        eventoId: form.eventoId ? parseInt(form.eventoId) : null,
        notas: form.notas.trim() || undefined,
      }
      if (editTarget) {
        await updateGasto(editTarget.id, payload)
        toast.success('Gasto actualizado')
      } else {
        await createGasto({ ...payload, monto: montoNum })
        toast.success('Gasto registrado')
      }
      onSaved()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#E2D9CC]">
          <h2 className="text-base font-semibold text-[#2A1F1A]">{editTarget ? 'Editar gasto' : 'Nuevo gasto'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Fecha + monto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">Fecha *</label>
              <input type="date" required value={form.fecha} onChange={e => setField('fecha', e.target.value)}
                className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">Monto *</label>
              <input type="number" min="0" step="0.01" required placeholder="0"
                value={form.monto} onChange={e => setField('monto', e.target.value)}
                className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A]" />
            </div>
          </div>

          {/* Materia prima */}
          <div>
            <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">Materia prima (opcional)</label>
            {crearMpNombre ? (
              <MiniCrearMp nombre={crearMpNombre}
                onConfirmar={mp => { onNuevaMateria(mp); setField('materiaPrima', mp); if (!form.monto) setField('monto', mp.precioDefault); setCrearMpNombre(null) }}
                onCancelar={() => setCrearMpNombre(null)}
              />
            ) : (
              <BuscadorMpSimple materias={materias} value={form.materiaPrima}
                onChange={mp => { setField('materiaPrima', mp); if (mp && !form.monto) setField('monto', mp.precioDefault) }}
                onCrearNueva={nombre => setCrearMpNombre(nombre)}
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">
              Descripción {!form.materiaPrima && <span className="text-rose-500">*</span>}
            </label>
            <input type="text" placeholder={form.materiaPrima ? 'Opcional' : 'Ej: Cajas de packaging, Transporte...'}
              value={form.descripcion} onChange={e => setField('descripcion', e.target.value)}
              className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A]" />
          </div>

          {/* Evento */}
          <div>
            <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">Evento (opcional)</label>
            <select value={form.eventoId} onChange={e => setField('eventoId', e.target.value)}
              className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A] bg-white">
              <option value="">Sin evento</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-[#7A6A5A] mb-1.5">Notas (opcional)</label>
            <input type="text" placeholder="Notas adicionales..."
              value={form.notas} onChange={e => setField('notas', e.target.value)}
              className="w-full border border-[#E2D9CC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B5A28A]" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm text-[#7A6A5A] border border-[#E2D9CC] rounded-xl hover:bg-[#FBF6EC] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-[#2A1F1A] text-white rounded-xl hover:bg-[#1A1310] disabled:opacity-40 transition-colors">
              {saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Registrar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [materias, setMaterias] = useState<MateriaPrima[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Gasto | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [gs, mts, evs] = await Promise.all([getGastos(), getMateriasPrimas(), getEventos()])
      setGastos(gs)
      setMaterias(mts)
      setEventos(evs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!confirmId) return
    setDeleting(true)
    try {
      await deleteGasto(confirmId)
      toast.success('Gasto eliminado')
      setConfirmId(null)
      load()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const totalGastos = gastos.reduce((s, g) => s + parseFloat(g.monto), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-[#F1E4CC] flex items-center justify-center shrink-0">
          <Receipt size={16} color="#2A1F1A" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-[#2A1F1A]">Gastos</h1>
          {!loading && gastos.length > 0 && (
            <p className="text-xs text-[#7A6A5A]">{gastos.length} registros · {formatMonto(totalGastos)} total</p>
          )}
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 text-xs font-medium bg-[#2A1F1A] text-white px-3 py-2 rounded-xl hover:bg-[#1A1310] transition-colors shrink-0"
        >
          <Plus size={13} strokeWidth={2.5} /> Nuevo gasto
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : gastos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Receipt size={32} className="text-[#E2D9CC] mb-4" strokeWidth={1.5} />
          <p className="text-base font-semibold text-[#2A1F1A]">Sin gastos registrados</p>
          <p className="text-sm text-[#7A6A5A] mt-1">Registrá tus primeros gastos para llevar el control.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2D9CC] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2D9CC] bg-[#FBF6EC]">
                  <th className="text-left text-xs font-medium text-[#7A6A5A] px-4 py-3">Fecha</th>
                  <th className="text-left text-xs font-medium text-[#7A6A5A] px-4 py-3">Descripción</th>
                  <th className="text-left text-xs font-medium text-[#7A6A5A] px-4 py-3 hidden sm:table-cell">Evento</th>
                  <th className="text-right text-xs font-medium text-[#7A6A5A] px-4 py-3">Monto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => {
                  const label = g.materiaPrima?.nombre ?? g.descripcion ?? '—'
                  return (
                    <tr key={g.id} className="border-b border-[#E2D9CC] last:border-0 hover:bg-[#FAFBFC] transition-colors group">
                      <td className="px-4 py-3 text-sm text-[#7A6A5A] whitespace-nowrap">{formatFecha(g.fecha)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#2A1F1A] truncate max-w-[200px]">{label}</p>
                        {g.notas && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <StickyNote size={10} className="text-amber-400 shrink-0" />
                            <p className="text-xs text-[#7A6A5A] truncate max-w-[180px]">{g.notas}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {g.evento ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1E4CC] text-[#2A1F1A] font-medium">{g.evento.nombre}</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F6EFE1] text-[#7A6A5A]">Sin evento</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-[#2A1F1A] whitespace-nowrap">{formatMonto(parseFloat(g.monto))}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditTarget(g); setModalOpen(true) }}
                            className="p-2 rounded-xl text-[#B5A28A] hover:text-[#2A1F1A] hover:bg-[#FBF6EC] transition-colors"
                            title="Editar">
                            <Pencil size={15} strokeWidth={2} />
                          </button>
                          <button onClick={() => setConfirmId(g.id)}
                            className="p-2 rounded-xl text-[#B5A28A] hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar">
                            <Trash2 size={15} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#FBF6EC]">
            <span className="text-xs text-[#7A6A5A]">Total</span>
            <span className="text-sm font-bold text-[#2A1F1A]">{formatMonto(totalGastos)}</span>
          </div>
        </div>
      )}

      <GastoModal
        isOpen={modalOpen}
        editTarget={editTarget}
        materias={materias}
        eventos={eventos}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSaved={() => { setModalOpen(false); setEditTarget(null); load() }}
        onNuevaMateria={mp => setMaterias(prev => [...prev, mp].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
      />

      <ConfirmModal
        isOpen={confirmId !== null}
        variant="danger"
        titulo="¿Eliminar este gasto?"
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Borrar gasto"
        onConfirmar={handleDelete}
        onCancelar={() => setConfirmId(null)}
        loading={deleting}
      />
    </div>
  )
}
