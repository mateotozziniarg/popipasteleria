import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles, ChevronDown, Plus, Trash2, X, Pencil, Check,
  Package, Layers, Lightbulb, ArrowRight, RefreshCw, Calendar
} from 'lucide-react'
import {
  PropuestaDetalle, PropuestaProducto, PropuestaCombo, PropuestaIdea,
  EstadoPropuesta, CategoriaIdea, IASugerencias,
  getPropuesta, updatePropuesta, deletePropuesta,
  addProducto, updateProducto, deleteProducto,
  addCombo, updateCombo, deleteCombo,
  addIdea, deleteIdea,
  convertirPropuesta, generarIdeas,
} from '../api/propuestas'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import LoadingSpinner from '../components/LoadingSpinner'

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
const categoriaLabel: Record<CategoriaIdea, string> = {
  RELLENO: 'Relleno',
  DECORACION: 'Decoración',
  PACKAGING: 'Packaging',
  PRECIO: 'Precio',
  OTRO: 'Otro',
}
const categoriaClass: Record<CategoriaIdea, string> = {
  RELLENO: 'bg-rose-50 text-rose-600',
  DECORACION: 'bg-purple-50 text-purple-600',
  PACKAGING: 'bg-blue-50 text-blue-600',
  PRECIO: 'bg-emerald-50 text-emerald-600',
  OTRO: 'bg-[#F7FAFC] text-[#6B7280]',
}

const ESTADOS: EstadoPropuesta[] = ['BORRADOR', 'PRESENTADA', 'CONFIRMADA']
const CATEGORIAS: CategoriaIdea[] = ['RELLENO', 'DECORACION', 'PACKAGING', 'PRECIO', 'OTRO']

function formatPrecio(v: string | null | undefined) {
  if (!v) return ''
  return parseFloat(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

interface ComboForm {
  nombre: string
  descripcion: string
  precioCombo: string
  selectedProductos: { propuestaProductoId: number; cantidad: number }[]
}

const emptyComboForm: ComboForm = { nombre: '', descripcion: '', precioCombo: '', selectedProductos: [] }

export default function PropuestaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const propuestaId = parseInt(id!)

  const [propuesta, setPropuesta] = useState<PropuestaDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  // Inline edits
  const [editingNombre, setEditingNombre] = useState(false)
  const [nombreVal, setNombreVal] = useState('')
  const [editingTematica, setEditingTematica] = useState(false)
  const [tematicaVal, setTematicaVal] = useState('')
  const [editingDescripcion, setEditingDescripcion] = useState(false)
  const [descripcionVal, setDescripcionVal] = useState('')
  const [savingField, setSavingField] = useState(false)

  // Estado dropdown
  const [estadoOpen, setEstadoOpen] = useState(false)

  // Producto inline add
  const [addProd, setAddProd] = useState({ nombre: '', descripcion: '', precio: '', notas: '' })
  const [addingProd, setAddingProd] = useState(false)
  const [editingProdId, setEditingProdId] = useState<number | null>(null)
  const [editProd, setEditProd] = useState({ nombre: '', descripcion: '', precio: '', notas: '' })
  const [savingProd, setSavingProd] = useState(false)
  const [confirmDeleteProd, setConfirmDeleteProd] = useState<number | null>(null)
  const [deletingProd, setDeletingProd] = useState(false)

  // Combos
  const [comboModalOpen, setComboModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<PropuestaCombo | null>(null)
  const [comboForm, setComboForm] = useState<ComboForm>(emptyComboForm)
  const [savingCombo, setSavingCombo] = useState(false)
  const [confirmDeleteCombo, setConfirmDeleteCombo] = useState<number | null>(null)
  const [deletingCombo, setDeletingCombo] = useState(false)

  // Ideas
  const [addIdea_, setAddIdea_] = useState({ texto: '', categoria: 'DECORACION' as CategoriaIdea })
  const [addingIdea, setAddingIdea] = useState(false)

  // Convertir
  const [convertirOpen, setConvertirOpen] = useState(false)
  const [convertirFecha, setConvertirFecha] = useState('')
  const [convertirLoading, setConvertirLoading] = useState(false)

  // IA
  const [iaLoading, setIaLoading] = useState(false)
  const [iaSugerencias, setIaSugerencias] = useState<IASugerencias | null>(null)
  const [iaDrawerOpen, setIaDrawerOpen] = useState(false)
  const [iaUsados, setIaUsados] = useState<Set<string>>(new Set())

  // Delete propuesta
  const [confirmDeletePropuesta, setConfirmDeletePropuesta] = useState(false)
  const [deletingPropuesta, setDeletingPropuesta] = useState(false)

  const estadoRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const data = await getPropuesta(propuestaId)
      setPropuesta(data)
    } catch {
      navigate('/propuestas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [propuestaId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (estadoRef.current && !estadoRef.current.contains(e.target as Node)) {
        setEstadoOpen(false)
      }
    }
    if (estadoOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [estadoOpen])

  if (loading) return <div className="pt-20"><LoadingSpinner /></div>
  if (!propuesta) return null

  // --- Nombre ---
  function startEditNombre() {
    setNombreVal(propuesta!.nombre)
    setEditingNombre(true)
  }
  async function saveNombre() {
    if (!nombreVal.trim()) return
    setSavingField(true)
    try {
      await updatePropuesta(propuestaId, { nombre: nombreVal.trim() })
      setPropuesta(p => p ? { ...p, nombre: nombreVal.trim() } : p)
      setEditingNombre(false)
    } finally {
      setSavingField(false)
    }
  }

  // --- Temática ---
  function startEditTematica() {
    setTematicaVal(propuesta!.tematica ?? '')
    setEditingTematica(true)
  }
  async function saveTematica() {
    setSavingField(true)
    try {
      await updatePropuesta(propuestaId, { tematica: tematicaVal.trim() || undefined })
      setPropuesta(p => p ? { ...p, tematica: tematicaVal.trim() || null } : p)
      setEditingTematica(false)
    } finally {
      setSavingField(false)
    }
  }

  // --- Descripción ---
  function startEditDescripcion() {
    setDescripcionVal(propuesta!.descripcion ?? '')
    setEditingDescripcion(true)
  }
  async function saveDescripcion() {
    setSavingField(true)
    try {
      await updatePropuesta(propuestaId, { descripcion: descripcionVal.trim() || undefined })
      setPropuesta(p => p ? { ...p, descripcion: descripcionVal.trim() || null } : p)
      setEditingDescripcion(false)
    } finally {
      setSavingField(false)
    }
  }

  // --- Estado ---
  async function changeEstado(estado: EstadoPropuesta) {
    setEstadoOpen(false)
    try {
      await updatePropuesta(propuestaId, { estado })
      setPropuesta(p => p ? { ...p, estado } : p)
    } catch { /* noop */ }
  }

  // --- Productos ---
  async function handleAddProd() {
    if (!addProd.nombre.trim()) return
    setAddingProd(true)
    try {
      const np = await addProducto(propuestaId, {
        nombre: addProd.nombre.trim(),
        descripcion: addProd.descripcion.trim() || undefined,
        precio: addProd.precio || undefined,
        notas: addProd.notas.trim() || undefined,
      })
      setPropuesta(p => p ? { ...p, productos: [...p.productos, np] } : p)
      setAddProd({ nombre: '', descripcion: '', precio: '', notas: '' })
    } finally {
      setAddingProd(false)
    }
  }

  function startEditProd(prod: PropuestaProducto) {
    setEditingProdId(prod.id)
    setEditProd({
      nombre: prod.nombre,
      descripcion: prod.descripcion ?? '',
      precio: prod.precio ?? '',
      notas: prod.notas ?? '',
    })
  }

  async function saveEditProd() {
    if (!editingProdId || !editProd.nombre.trim()) return
    setSavingProd(true)
    try {
      const updated = await updateProducto(propuestaId, editingProdId, {
        nombre: editProd.nombre.trim(),
        descripcion: editProd.descripcion.trim() || undefined,
        precio: editProd.precio || null,
        notas: editProd.notas.trim() || undefined,
      })
      setPropuesta(p => p ? { ...p, productos: p.productos.map(pr => pr.id === editingProdId ? updated : pr) } : p)
      setEditingProdId(null)
    } finally {
      setSavingProd(false)
    }
  }

  async function execDeleteProd() {
    if (confirmDeleteProd === null) return
    setDeletingProd(true)
    try {
      await deleteProducto(propuestaId, confirmDeleteProd)
      setPropuesta(p => p ? {
        ...p,
        productos: p.productos.filter(pr => pr.id !== confirmDeleteProd),
        combos: p.combos.map(c => ({
          ...c,
          productos: c.productos.filter(cp => cp.propuestaProductoId !== confirmDeleteProd),
        })),
      } : p)
      setConfirmDeleteProd(null)
    } finally {
      setDeletingProd(false)
    }
  }

  // --- Combos ---
  function openAddCombo() {
    setEditingCombo(null)
    setComboForm(emptyComboForm)
    setComboModalOpen(true)
  }

  function openEditCombo(combo: PropuestaCombo) {
    setEditingCombo(combo)
    setComboForm({
      nombre: combo.nombre,
      descripcion: combo.descripcion ?? '',
      precioCombo: combo.precioCombo ?? '',
      selectedProductos: combo.productos.map(cp => ({ propuestaProductoId: cp.propuestaProductoId, cantidad: cp.cantidad })),
    })
    setComboModalOpen(true)
  }

  function toggleComboProducto(prodId: number) {
    setComboForm(f => {
      const exists = f.selectedProductos.find(p => p.propuestaProductoId === prodId)
      if (exists) {
        return { ...f, selectedProductos: f.selectedProductos.filter(p => p.propuestaProductoId !== prodId) }
      }
      return { ...f, selectedProductos: [...f.selectedProductos, { propuestaProductoId: prodId, cantidad: 1 }] }
    })
  }

  function setComboProdCantidad(prodId: number, cantidad: number) {
    setComboForm(f => ({
      ...f,
      selectedProductos: f.selectedProductos.map(p =>
        p.propuestaProductoId === prodId ? { ...p, cantidad: Math.max(1, cantidad) } : p
      ),
    }))
  }

  async function handleSaveCombo() {
    if (!comboForm.nombre.trim()) return
    setSavingCombo(true)
    try {
      const data = {
        nombre: comboForm.nombre.trim(),
        descripcion: comboForm.descripcion.trim() || undefined,
        precioCombo: comboForm.precioCombo || undefined,
        productos: comboForm.selectedProductos,
      }
      if (editingCombo) {
        const updated = await updateCombo(propuestaId, editingCombo.id, data)
        setPropuesta(p => p ? { ...p, combos: p.combos.map(c => c.id === editingCombo.id ? updated : c) } : p)
      } else {
        const newCombo = await addCombo(propuestaId, data)
        setPropuesta(p => p ? { ...p, combos: [...p.combos, newCombo] } : p)
      }
      setComboModalOpen(false)
    } finally {
      setSavingCombo(false)
    }
  }

  async function execDeleteCombo() {
    if (confirmDeleteCombo === null) return
    setDeletingCombo(true)
    try {
      await deleteCombo(propuestaId, confirmDeleteCombo)
      setPropuesta(p => p ? { ...p, combos: p.combos.filter(c => c.id !== confirmDeleteCombo) } : p)
      setConfirmDeleteCombo(null)
    } finally {
      setDeletingCombo(false)
    }
  }

  // --- Ideas ---
  async function handleAddIdea() {
    if (!addIdea_.texto.trim()) return
    setAddingIdea(true)
    try {
      const idea = await addIdea(propuestaId, { texto: addIdea_.texto.trim(), categoria: addIdea_.categoria })
      setPropuesta(p => p ? { ...p, ideas: [...p.ideas, idea] } : p)
      setAddIdea_(f => ({ ...f, texto: '' }))
    } finally {
      setAddingIdea(false)
    }
  }

  async function handleDeleteIdea(ideaId: number) {
    try {
      await deleteIdea(propuestaId, ideaId)
      setPropuesta(p => p ? { ...p, ideas: p.ideas.filter(i => i.id !== ideaId) } : p)
    } catch { /* noop */ }
  }

  // --- Convertir ---
  async function handleConvertir() {
    if (!convertirFecha) return
    setConvertirLoading(true)
    try {
      const evento = await convertirPropuesta(propuestaId, convertirFecha)
      setConvertirOpen(false)
      navigate(`/eventos/${evento.id}`)
    } finally {
      setConvertirLoading(false)
    }
  }

  // --- IA ---
  async function handleGenerarIA() {
    setIaLoading(true)
    try {
      const sug = await generarIdeas(propuestaId)
      setIaSugerencias(sug)
      setIaUsados(new Set())
      setIaDrawerOpen(true)
    } finally {
      setIaLoading(false)
    }
  }

  async function iaAgregarProducto(prod: IASugerencias['productosNuevos'][0], key: string) {
    try {
      const np = await addProducto(propuestaId, {
        nombre: prod.nombre,
        descripcion: prod.descripcion || undefined,
        precio: prod.precioSugerido ? String(prod.precioSugerido) : undefined,
        notas: prod.notas || undefined,
      })
      setPropuesta(p => p ? { ...p, productos: [...p.productos, np] } : p)
      setIaUsados(s => new Set([...s, key]))
    } catch { /* noop */ }
  }

  async function iaUsarNombreCombo(comboId: number, nombre: string, key: string) {
    try {
      const updated = await updateCombo(propuestaId, comboId, { nombre })
      setPropuesta(p => p ? { ...p, combos: p.combos.map(c => c.id === comboId ? updated : c) } : p)
      setIaUsados(s => new Set([...s, key]))
    } catch { /* noop */ }
  }

  async function iaUsarDescripcion(productoId: number, descripcion: string, key: string) {
    try {
      const updated = await updateProducto(propuestaId, productoId, { descripcion })
      setPropuesta(p => p ? { ...p, productos: p.productos.map(pr => pr.id === productoId ? updated : pr) } : p)
      setIaUsados(s => new Set([...s, key]))
    } catch { /* noop */ }
  }

  async function iaAgregarIdea(idea: { texto: string; categoria: CategoriaIdea }, key: string) {
    try {
      const newIdea = await addIdea(propuestaId, { texto: idea.texto, categoria: idea.categoria })
      setPropuesta(p => p ? { ...p, ideas: [...p.ideas, newIdea] } : p)
      setIaUsados(s => new Set([...s, key]))
    } catch { /* noop */ }
  }

  // --- Delete propuesta ---
  async function execDeletePropuesta() {
    setDeletingPropuesta(true)
    try {
      await deletePropuesta(propuestaId)
      navigate('/propuestas')
    } finally {
      setDeletingPropuesta(false)
    }
  }

  const ideasPorCategoria = CATEGORIAS.reduce<Record<CategoriaIdea, PropuestaIdea[]>>(
    (acc, cat) => ({ ...acc, [cat]: propuesta.ideas.filter(i => i.categoria === cat) }),
    {} as Record<CategoriaIdea, PropuestaIdea[]>
  )

  const puedeConvertir = propuesta.estado === 'PRESENTADA' || propuesta.estado === 'CONFIRMADA'

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-12">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/propuestas')}
          className="text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors mb-3 flex items-center gap-1"
        >
          ← Propuestas
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {editingNombre ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  className="text-xl font-semibold text-[#1F2937] border-b-2 border-[#9CC6EA] focus:outline-none bg-transparent flex-1"
                  value={nombreVal}
                  onChange={e => setNombreVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNombre(); if (e.key === 'Escape') setEditingNombre(false) }}
                  autoFocus
                />
                <button onClick={saveNombre} disabled={savingField} className="text-[#9CC6EA] hover:text-[#1F2937]">
                  <Check size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => setEditingNombre(false)} className="text-[#6B7280] hover:text-[#1F2937]">
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditNombre}
                className="text-xl font-semibold text-[#1F2937] hover:text-[#6B7280] transition-colors text-left truncate group flex items-center gap-2"
              >
                {propuesta.nombre}
                <Pencil size={13} strokeWidth={2} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
              </button>
            )}

            {/* Estado */}
            <div className="relative shrink-0" ref={estadoRef}>
              <button
                onClick={() => setEstadoOpen(o => !o)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${estadoClass[propuesta.estado]}`}
              >
                {estadoLabel[propuesta.estado]}
                <ChevronDown size={11} strokeWidth={2.5} />
              </button>
              {estadoOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5EAF1] rounded-xl shadow-lg z-20 min-w-[140px] py-1 overflow-hidden">
                  {ESTADOS.map(e => (
                    <button
                      key={e}
                      onClick={() => changeEstado(e)}
                      className={`w-full text-left text-sm px-3 py-2 hover:bg-[#F7FAFC] transition-colors ${propuesta.estado === e ? 'font-semibold text-[#1F2937]' : 'text-[#6B7280]'}`}
                    >
                      {estadoLabel[e]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {puedeConvertir && (
              <button
                onClick={() => { setConvertirFecha(''); setConvertirOpen(true) }}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <ArrowRight size={14} strokeWidth={2} />
                Convertir en evento
              </button>
            )}
            <button
              onClick={iaDrawerOpen ? () => setIaDrawerOpen(true) : handleGenerarIA}
              disabled={iaLoading}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1F2937] bg-[#CFE6F7] hover:bg-[#9CC6EA] px-3 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {iaLoading ? <LoadingSpinner inline /> : <Sparkles size={14} strokeWidth={2} />}
              {iaLoading ? 'Generando ideas...' : 'Generar ideas con IA'}
            </button>
            <button
              onClick={() => setConfirmDeletePropuesta(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Temática y descripción */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 mb-4">
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Temática</p>
          {editingTematica ? (
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
                value={tematicaVal}
                onChange={e => setTematicaVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTematica(); if (e.key === 'Escape') setEditingTematica(false) }}
                placeholder="Ej: Mundial de fútbol"
                autoFocus
              />
              <button onClick={saveTematica} disabled={savingField} className="text-[#9CC6EA] hover:text-[#1F2937]"><Check size={16} /></button>
              <button onClick={() => setEditingTematica(false)} className="text-[#6B7280] hover:text-[#1F2937]"><X size={15} /></button>
            </div>
          ) : (
            <button
              onClick={startEditTematica}
              className="text-sm text-[#1F2937] hover:text-[#6B7280] transition-colors text-left group flex items-center gap-2 w-full"
            >
              <span className={propuesta.tematica ? '' : 'text-[#9CC6EA] italic'}>
                {propuesta.tematica || 'Agregar temática...'}
              </span>
              <Pencil size={12} strokeWidth={2} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
            </button>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Descripción</p>
          {editingDescripcion ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] resize-none"
                value={descripcionVal}
                onChange={e => setDescripcionVal(e.target.value)}
                rows={3}
                placeholder="Descripción libre de la propuesta..."
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveDescripcion} disabled={savingField} className="text-xs text-[#1F2937] bg-[#CFE6F7] hover:bg-[#9CC6EA] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Check size={12} /> Guardar
                </button>
                <button onClick={() => setEditingDescripcion(false)} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-3 py-1.5 rounded-lg hover:bg-[#F7FAFC] transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEditDescripcion}
              className="text-sm text-[#1F2937] hover:text-[#6B7280] transition-colors text-left group flex items-start gap-2 w-full"
            >
              <span className={`whitespace-pre-wrap ${propuesta.descripcion ? '' : 'text-[#9CC6EA] italic'}`}>
                {propuesta.descripcion || 'Agregar descripción...'}
              </span>
              <Pencil size={12} strokeWidth={2} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0 mt-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Package size={15} color="#9CC6EA" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-[#1F2937]">Productos</h2>
          <span className="text-xs text-[#6B7280] ml-auto">{propuesta.productos.length} producto{propuesta.productos.length !== 1 ? 's' : ''}</span>
        </div>

        {propuesta.productos.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#E5EAF1]">
                  <th className="text-left py-2 pr-3 font-medium">Nombre</th>
                  <th className="text-left py-2 pr-3 font-medium">Descripción</th>
                  <th className="text-left py-2 pr-3 font-medium w-24">Precio</th>
                  <th className="text-left py-2 pr-3 font-medium">Notas</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {propuesta.productos.map(prod => (
                  editingProdId === prod.id ? (
                    <tr key={prod.id} className="border-b border-[#E5EAF1]">
                      <td className="py-2 pr-2">
                        <input className="w-full border border-[#9CC6EA] rounded-lg px-2 py-1 text-sm focus:outline-none" value={editProd.nombre} onChange={e => setEditProd(f => ({ ...f, nombre: e.target.value }))} />
                      </td>
                      <td className="py-2 pr-2">
                        <input className="w-full border border-[#E5EAF1] rounded-lg px-2 py-1 text-sm focus:outline-none" value={editProd.descripcion} onChange={e => setEditProd(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" className="w-full border border-[#E5EAF1] rounded-lg px-2 py-1 text-sm focus:outline-none" value={editProd.precio} onChange={e => setEditProd(f => ({ ...f, precio: e.target.value }))} placeholder="$" />
                      </td>
                      <td className="py-2 pr-2">
                        <input className="w-full border border-[#E5EAF1] rounded-lg px-2 py-1 text-sm focus:outline-none" value={editProd.notas} onChange={e => setEditProd(f => ({ ...f, notas: e.target.value }))} placeholder="Notas" />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <button onClick={saveEditProd} disabled={savingProd} className="text-[#9CC6EA] hover:text-[#1F2937]"><Check size={14} /></button>
                          <button onClick={() => setEditingProdId(null)} className="text-[#6B7280] hover:text-[#1F2937]"><X size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={prod.id} className="border-b border-[#E5EAF1] hover:bg-[#F7FAFC] cursor-pointer group" onClick={() => startEditProd(prod)}>
                      <td className="py-2.5 pr-3 font-medium text-[#1F2937]">{prod.nombre}</td>
                      <td className="py-2.5 pr-3 text-[#6B7280]">{prod.descripcion || <span className="italic text-[#9CC6EA]">—</span>}</td>
                      <td className="py-2.5 pr-3 text-[#1F2937]">{prod.precio ? formatPrecio(prod.precio) : <span className="italic text-[#9CC6EA]">—</span>}</td>
                      <td className="py-2.5 pr-3 text-[#6B7280]">{prod.notas || <span className="italic text-[#9CC6EA]">—</span>}</td>
                      <td className="py-2.5">
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDeleteProd(prod.id) }}
                          className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Fila agregar */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <input
            className="flex-1 min-w-[120px] border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
            placeholder="Nombre del producto"
            value={addProd.nombre}
            onChange={e => setAddProd(f => ({ ...f, nombre: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAddProd() }}
          />
          <input
            className="flex-1 min-w-[100px] border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
            placeholder="Descripción"
            value={addProd.descripcion}
            onChange={e => setAddProd(f => ({ ...f, descripcion: e.target.value }))}
          />
          <input
            type="number"
            className="w-24 border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
            placeholder="Precio"
            value={addProd.precio}
            onChange={e => setAddProd(f => ({ ...f, precio: e.target.value }))}
          />
          <input
            className="flex-1 min-w-[100px] border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
            placeholder="Notas"
            value={addProd.notas}
            onChange={e => setAddProd(f => ({ ...f, notas: e.target.value }))}
          />
          <button
            onClick={handleAddProd}
            disabled={!addProd.nombre.trim() || addingProd}
            className="w-9 h-9 rounded-xl bg-[#CFE6F7] hover:bg-[#9CC6EA] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
          >
            {addingProd ? <LoadingSpinner inline /> : <Plus size={16} strokeWidth={2.5} color="#1F2937" />}
          </button>
        </div>
      </div>

      {/* Combos */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={15} color="#9CC6EA" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-[#1F2937]">Combos</h2>
          <button
            onClick={openAddCombo}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[#1F2937] bg-[#CFE6F7] hover:bg-[#9CC6EA] px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={12} strokeWidth={2.5} />
            Nuevo combo
          </button>
        </div>

        {propuesta.combos.length === 0 ? (
          <p className="text-sm text-[#9CC6EA] italic text-center py-4">Sin combos todavía</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {propuesta.combos.map(combo => (
              <div key={combo.id} className="border border-[#E5EAF1] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm text-[#1F2937]">{combo.nombre}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditCombo(combo)} className="text-[#6B7280] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F7FAFC] transition-colors">
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button onClick={() => setConfirmDeleteCombo(combo.id)} className="text-red-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {combo.precioCombo && (
                  <p className="text-sm font-semibold text-emerald-600 mb-2">{formatPrecio(combo.precioCombo)}</p>
                )}
                {combo.descripcion && (
                  <p className="text-xs text-[#6B7280] mb-2">{combo.descripcion}</p>
                )}
                {combo.productos.length > 0 ? (
                  <ul className="space-y-1">
                    {combo.productos.map(cp => (
                      <li key={cp.id} className="text-xs text-[#6B7280] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#9CC6EA] shrink-0" />
                        {cp.producto.nombre}
                        {cp.cantidad > 1 && <span className="text-[#9CC6EA] font-medium">×{cp.cantidad}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#9CC6EA] italic">Sin productos</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ideas */}
      <div className="bg-white border border-[#E5EAF1] rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={15} color="#9CC6EA" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-[#1F2937]">Ideas</h2>
        </div>

        {/* Por categoría */}
        {CATEGORIAS.some(cat => ideasPorCategoria[cat].length > 0) && (
          <div className="mb-4 space-y-3">
            {CATEGORIAS.map(cat => {
              const ideas = ideasPorCategoria[cat]
              if (ideas.length === 0) return null
              return (
                <div key={cat}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded-full inline-block ${categoriaClass[cat]}`}>
                    {categoriaLabel[cat]}
                  </p>
                  <ul className="space-y-1.5">
                    {ideas.map(idea => (
                      <li key={idea.id} className="flex items-start gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9CC6EA] mt-1.5 shrink-0" />
                        <span className="text-sm text-[#1F2937] flex-1">{idea.texto}</span>
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-all shrink-0"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {propuesta.ideas.length === 0 && (
          <p className="text-sm text-[#9CC6EA] italic mb-3">Sin ideas todavía</p>
        )}

        {/* Agregar idea */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#E5EAF1]">
          <input
            className="flex-1 min-w-[200px] border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA]"
            placeholder="Nueva idea..."
            value={addIdea_.texto}
            onChange={e => setAddIdea_(f => ({ ...f, texto: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAddIdea() }}
          />
          <select
            className="border border-[#E5EAF1] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] bg-white"
            value={addIdea_.categoria}
            onChange={e => setAddIdea_(f => ({ ...f, categoria: e.target.value as CategoriaIdea }))}
          >
            {CATEGORIAS.map(cat => (
              <option key={cat} value={cat}>{categoriaLabel[cat]}</option>
            ))}
          </select>
          <button
            onClick={handleAddIdea}
            disabled={!addIdea_.texto.trim() || addingIdea}
            className="w-9 h-9 rounded-xl bg-[#CFE6F7] hover:bg-[#9CC6EA] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
          >
            {addingIdea ? <LoadingSpinner inline /> : <Plus size={16} strokeWidth={2.5} color="#1F2937" />}
          </button>
        </div>
      </div>

      {/* Modal combo */}
      {comboModalOpen && (
        <Modal title={editingCombo ? 'Editar combo' : 'Nuevo combo'} onClose={() => setComboModalOpen(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={comboForm.nombre}
                onChange={e => setComboForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Combo cumpleaños"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Descripción <span className="text-[#6B7280] font-normal">(opcional)</span></label>
                <input
                  className={inputClass}
                  value={comboForm.descripcion}
                  onChange={e => setComboForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción del combo"
                />
              </div>
              <div className="w-32">
                <label className={labelClass}>Precio</label>
                <input
                  type="number"
                  className={inputClass}
                  value={comboForm.precioCombo}
                  onChange={e => setComboForm(f => ({ ...f, precioCombo: e.target.value }))}
                  placeholder="$"
                />
              </div>
            </div>
            {propuesta.productos.length > 0 && (
              <div>
                <label className={labelClass}>Productos del combo</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {propuesta.productos.map(prod => {
                    const sel = comboForm.selectedProductos.find(p => p.propuestaProductoId === prod.id)
                    return (
                      <div key={prod.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`prod-${prod.id}`}
                          checked={!!sel}
                          onChange={() => toggleComboProducto(prod.id)}
                          className="rounded"
                        />
                        <label htmlFor={`prod-${prod.id}`} className="flex-1 text-sm text-[#1F2937] cursor-pointer">
                          {prod.nombre}
                          {prod.precio && <span className="text-[#6B7280] ml-1">{formatPrecio(prod.precio)}</span>}
                        </label>
                        {sel && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setComboProdCantidad(prod.id, sel.cantidad - 1)} className="w-6 h-6 rounded-lg bg-[#F7FAFC] hover:bg-[#E5EAF1] text-[#1F2937] text-xs font-bold flex items-center justify-center">−</button>
                            <span className="w-6 text-center text-sm font-medium text-[#1F2937]">{sel.cantidad}</span>
                            <button onClick={() => setComboProdCantidad(prod.id, sel.cantidad + 1)} className="w-6 h-6 rounded-lg bg-[#F7FAFC] hover:bg-[#E5EAF1] text-[#1F2937] text-xs font-bold flex items-center justify-center">+</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setComboModalOpen(false)} className={btnGhost}>Cancelar</button>
              <button
                onClick={handleSaveCombo}
                disabled={!comboForm.nombre.trim() || savingCombo}
                className={btnPrimary}
              >
                {savingCombo ? <><LoadingSpinner inline /><span>Guardando...</span></> : editingCombo ? 'Guardar cambios' : 'Crear combo'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal convertir en evento */}
      {convertirOpen && (
        <Modal title="Convertir en evento" onClose={() => setConvertirOpen(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[#6B7280]">
              Se creará un evento basado en esta propuesta. Los productos sin registro en el catálogo serán agregados automáticamente.
            </p>
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><Calendar size={14} strokeWidth={2} /> Fecha del evento</span>
              </label>
              <input
                type="date"
                className={inputClass}
                value={convertirFecha}
                onChange={e => setConvertirFecha(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setConvertirOpen(false)} className={btnGhost}>Cancelar</button>
              <button
                onClick={handleConvertir}
                disabled={!convertirFecha || convertirLoading}
                className="bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {convertirLoading ? <><LoadingSpinner inline /><span>Convirtiendo...</span></> : <><ArrowRight size={14} />Convertir en evento</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete producto */}
      <ConfirmModal
        isOpen={confirmDeleteProd !== null}
        titulo="¿Eliminar producto?"
        descripcion="También se eliminará de todos los combos de esta propuesta."
        labelConfirmar="Eliminar"
        onConfirmar={execDeleteProd}
        onCancelar={() => setConfirmDeleteProd(null)}
        loading={deletingProd}
      />

      {/* Confirm delete combo */}
      <ConfirmModal
        isOpen={confirmDeleteCombo !== null}
        titulo="¿Eliminar combo?"
        labelConfirmar="Eliminar"
        onConfirmar={execDeleteCombo}
        onCancelar={() => setConfirmDeleteCombo(null)}
        loading={deletingCombo}
      />

      {/* Confirm delete propuesta */}
      <ConfirmModal
        isOpen={confirmDeletePropuesta}
        titulo={`¿Eliminar "${propuesta.nombre}"?`}
        descripcion="Se eliminarán todos los productos, combos e ideas. Esta acción no se puede deshacer."
        labelConfirmar="Eliminar propuesta"
        onConfirmar={execDeletePropuesta}
        onCancelar={() => setConfirmDeletePropuesta(false)}
        loading={deletingPropuesta}
      />

      {/* Drawer IA */}
      {iaDrawerOpen && iaSugerencias && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIaDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white border-l border-[#E5EAF1] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF1] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} color="#9CC6EA" strokeWidth={2} />
                <h3 className="font-semibold text-[#1F2937] text-sm">Sugerencias de IA</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerarIA}
                  disabled={iaLoading}
                  className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1F2937] px-2.5 py-1.5 rounded-lg hover:bg-[#F7FAFC] transition-colors disabled:opacity-50"
                >
                  {iaLoading ? <LoadingSpinner inline /> : <RefreshCw size={12} strokeWidth={2} />}
                  Regenerar
                </button>
                <button onClick={() => setIaDrawerOpen(false)} className="text-[#6B7280] hover:text-[#1F2937] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7FAFC] transition-colors">
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Productos nuevos */}
              {iaSugerencias.productosNuevos.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Productos nuevos sugeridos</p>
                  <div className="space-y-2.5">
                    {iaSugerencias.productosNuevos.map((prod, i) => {
                      const key = `prod-nuevo-${i}`
                      const usado = iaUsados.has(key)
                      return (
                        <div key={i} className={`border rounded-xl p-3.5 ${usado ? 'border-emerald-200 bg-emerald-50' : 'border-[#E5EAF1]'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1F2937]">{prod.nombre}</p>
                              {prod.descripcion && <p className="text-xs text-[#6B7280] mt-0.5">{prod.descripcion}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                {prod.precioSugerido > 0 && (
                                  <span className="text-xs font-medium text-emerald-600">
                                    {prod.precioSugerido.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                                  </span>
                                )}
                                {prod.notas && <span className="text-xs text-[#9CC6EA]">{prod.notas}</span>}
                              </div>
                            </div>
                            {!usado && (
                              <button
                                onClick={() => iaAgregarProducto(prod, key)}
                                className="text-xs font-medium text-[#1F2937] bg-[#CFE6F7] hover:bg-[#9CC6EA] px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                              >
                                Agregar
                              </button>
                            )}
                            {usado && <span className="text-xs text-emerald-600 font-medium shrink-0">Agregado ✓</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Nombres para combos */}
              {iaSugerencias.nombresCombo.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Nombres sugeridos para combos</p>
                  <div className="space-y-3">
                    {iaSugerencias.nombresCombo.map((item, i) => {
                      const combo = propuesta.combos.find(c => c.id === item.comboId)
                      if (!combo) return null
                      return (
                        <div key={i} className="border border-[#E5EAF1] rounded-xl p-3.5">
                          <p className="text-xs text-[#6B7280] mb-2">Para: <span className="font-medium text-[#1F2937]">{combo.nombre}</span></p>
                          <div className="space-y-1.5">
                            {item.nombresSugeridos.map((nombre, j) => {
                              const key = `combo-nombre-${i}-${j}`
                              const usado = iaUsados.has(key)
                              return (
                                <div key={j} className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-[#1F2937] flex-1">{nombre}</span>
                                  {!usado ? (
                                    <button
                                      onClick={() => iaUsarNombreCombo(item.comboId, nombre, key)}
                                      className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-1 rounded-lg hover:bg-[#F7FAFC] transition-colors shrink-0"
                                    >
                                      Usar
                                    </button>
                                  ) : (
                                    <span className="text-xs text-emerald-600 font-medium shrink-0">Usado ✓</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Descripciones para productos */}
              {iaSugerencias.descripcionesProducto.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Descripciones sugeridas</p>
                  <div className="space-y-2.5">
                    {iaSugerencias.descripcionesProducto.map((item, i) => {
                      const prod = propuesta.productos.find(p => p.id === item.productoId)
                      if (!prod) return null
                      const key = `desc-${i}`
                      const usado = iaUsados.has(key)
                      return (
                        <div key={i} className={`border rounded-xl p-3.5 ${usado ? 'border-emerald-200 bg-emerald-50' : 'border-[#E5EAF1]'}`}>
                          <p className="text-xs text-[#6B7280] mb-1">Para: <span className="font-medium text-[#1F2937]">{prod.nombre}</span></p>
                          <p className="text-sm text-[#1F2937] mb-2">{item.descripcion}</p>
                          {!usado ? (
                            <button
                              onClick={() => iaUsarDescripcion(item.productoId, item.descripcion, key)}
                              className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-1 rounded-lg hover:bg-[#F7FAFC] transition-colors"
                            >
                              Usar esta descripción
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">Aplicado ✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Ideas generales */}
              {iaSugerencias.ideasGenerales.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Ideas generales</p>
                  <div className="space-y-2">
                    {iaSugerencias.ideasGenerales.map((idea, i) => {
                      const key = `idea-gen-${i}`
                      const usado = iaUsados.has(key)
                      return (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${usado ? 'border-emerald-200 bg-emerald-50' : 'border-[#E5EAF1]'}`}>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${categoriaClass[idea.categoria as CategoriaIdea] || categoriaClass.OTRO}`}>
                            {categoriaLabel[idea.categoria as CategoriaIdea] || idea.categoria}
                          </span>
                          <p className="text-sm text-[#1F2937] flex-1">{idea.texto}</p>
                          {!usado ? (
                            <button
                              onClick={() => iaAgregarIdea({ texto: idea.texto, categoria: (idea.categoria as CategoriaIdea) || 'OTRO' }, key)}
                              className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-1 rounded-lg hover:bg-[#F7FAFC] transition-colors shrink-0"
                            >
                              Agregar
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium shrink-0">Agregado ✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
