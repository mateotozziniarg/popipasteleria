import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, ChevronRight, Package, Layers } from 'lucide-react'
import { PropuestaListItem, EstadoPropuesta, getPropuestas, createPropuesta } from '../api/propuestas'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] focus:border-[#9CC6EA] transition-colors'
const labelClass = 'block text-sm font-medium text-[#1F2937] mb-1.5'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors'

const estadoLabel: Record<EstadoPropuesta, string> = {
  BORRADOR: 'Borrador',
  PRESENTADA: 'Presentada',
  CONFIRMADA: 'Confirmada',
}

const estadoClass: Record<EstadoPropuesta, string> = {
  BORRADOR: 'bg-[#F7FAFC] text-[#6B7280] border border-[#E5EAF1]',
  PRESENTADA: 'bg-amber-50 text-amber-700 border border-amber-200',
  CONFIRMADA: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export default function PropuestasPage() {
  const navigate = useNavigate()
  const [propuestas, setPropuestas] = useState<PropuestaListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', tematica: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setPropuestas(await getPropuestas())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm({ nombre: '', tematica: '' })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    setSaving(true)
    setError('')
    try {
      const created = await createPropuesta({ nombre: form.nombre.trim(), tematica: form.tematica.trim() || undefined })
      setModalOpen(false)
      navigate(`/propuestas/${created.id}`)
    } catch {
      setError('Error al crear. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CFE6F7] flex items-center justify-center">
            <Sparkles size={16} color="#1F2937" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-[#1F2937]">Propuestas</h1>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Nueva propuesta
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : propuestas.length === 0 ? (
        <EmptyState
          variant="eventos"
          titulo="Todavía no hay propuestas"
          descripcion="Creá tu primera propuesta para diseñar pedidos con ayuda de IA."
          accion={
            <button onClick={openCreate} className="bg-[#1F2937] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#374151] transition-colors">
              Crear primera propuesta
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {propuestas.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/propuestas/${p.id}`)}
              className="bg-white border border-[#E5EAF1] rounded-2xl px-5 py-4 cursor-pointer hover:border-[#9CC6EA] hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1F2937] truncate">{p.nombre}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${estadoClass[p.estado]}`}>
                      {estadoLabel[p.estado]}
                    </span>
                  </div>
                  {p.tematica && (
                    <p className="text-xs text-[#6B7280] mt-0.5">{p.tematica}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Package size={11} color="#9CC6EA" strokeWidth={2} />
                      <span className="text-xs text-[#6B7280]">{p._count.productos} productos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers size={11} color="#9CC6EA" strokeWidth={2} />
                      <span className="text-xs text-[#6B7280]">{p._count.combos} combos</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs text-[#6B7280]">{formatFecha(p.createdAt)}</p>
                  <ChevronRight size={16} color="#E5EAF1" strokeWidth={2} className="group-hover:text-[#9CC6EA] transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="Nueva propuesta" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Cumpleaños de Luna"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>
                Temática <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <input
                className={inputClass}
                value={form.tematica}
                onChange={e => setForm(f => ({ ...f, tematica: e.target.value }))}
                placeholder="Ej: Princesas, animales, deportes..."
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
                {saving ? <><LoadingSpinner inline /><span>Creando...</span></> : 'Crear propuesta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
