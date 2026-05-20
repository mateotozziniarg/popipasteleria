import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, Trash2, ShoppingCart, Truck, DollarSign, CreditCard,
  X, RefreshCw, ChevronDown, ChevronRight, FlaskConical, TrendingUp, TrendingDown, Calendar
} from 'lucide-react'
import { Evento, getEventos } from '../api/eventos'
import { Pedido, PedidoInput, EstadoEntrega, EstadoPago, getPedidos, createPedido, updatePedido, deletePedido } from '../api/pedidos'
import { Producto, getProductos, createProducto, addPedidoProducto, deletePedidoProducto } from '../api/productos'
import {
  MateriaPrima, EventoGasto,
  getMateriasPrimas, createMateriaPrima,
  getEventoGastos, createEventoGasto, updateEventoGasto, deleteEventoGasto
} from '../api/materiasPrimas'
import { Cliente, getClientes, createCliente } from '../api/clientes'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

interface ItemForm {
  productoId: number
  nombre: string
  cantidad: number
  precioUnitario: string
}

type ClienteRef = { id: number; nombre: string; telefono: string | null }

interface PedidoFormState {
  clienteId: number | null
  clienteRef: ClienteRef | null
  nombreCliente: string
  precioTotal: string
  precioManual: boolean
  estadoEntrega: EstadoEntrega
  estadoPago: EstadoPago
  notas: string
  montoSeña: string
  items: ItemForm[]
}

const emptyForm: PedidoFormState = {
  clienteId: null,
  clienteRef: null,
  nombreCliente: '',
  precioTotal: '',
  precioManual: false,
  estadoEntrega: 'pendiente',
  estadoPago: 'sin_seña',
  notas: '',
  montoSeña: '',
  items: [],
}

const etiquetaEntrega: Record<EstadoEntrega, string> = { pendiente: 'Pendiente', entregado: 'Entregado' }
const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Sin seña', señado: 'Señado', pagado: 'Pagado' }

const badgeEntrega = (e: EstadoEntrega) =>
  e === 'entregado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'

const badgePago = (e: EstadoPago) =>
  e === 'pagado'
    ? 'bg-emerald-50 text-emerald-700'
    : e === 'señado'
    ? 'bg-[#CFE6F7] text-[#1F2937]'
    : 'bg-rose-50 text-rose-600'

const formatMonto = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors'
const labelClass = 'block text-sm font-medium text-[#1F2937] mb-1.5'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors'
const inputInline = 'border border-[#E5EAF1] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors'

function calcularTotal(items: ItemForm[]): number {
  return items.reduce((s, i) => s + i.cantidad * (parseFloat(i.precioUnitario) || 0), 0)
}

// ── Buscador de productos ──────────────────────────────────────────
interface BuscadorProductosProps {
  productos: Producto[]
  itemsActuales: ItemForm[]
  onAgregar: (item: ItemForm) => void
  onCrearYAgregar: (nombre: string) => void
}

function BuscadorProductos({ productos, itemsActuales, onAgregar, onCrearYAgregar }: BuscadorProductosProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const idsActuales = new Set(itemsActuales.map(i => i.productoId))
  const filtrados = productos.filter(
    p => !idsActuales.has(p.id) && p.nombre.toLowerCase().includes(query.toLowerCase())
  )
  const mostrarCrear = query.trim().length > 0 && !productos.some(p => p.nombre.toLowerCase() === query.toLowerCase())

  function seleccionar(p: Producto) {
    onAgregar({ productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: p.precioDefault })
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        className={inputClass}
        placeholder="Buscar producto..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtrados.length > 0 || mostrarCrear) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => seleccionar(p)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{p.nombre}</span>
              <span className="text-[#6B7280] text-xs">{formatMonto(parseFloat(p.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button
              type="button"
              onClick={() => { onCrearYAgregar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form para crear producto nuevo inline (sin <form> anidado) ──
interface MiniCrearProductoProps {
  nombre: string
  onConfirmar: (producto: Producto) => void
  onCancelar: () => void
}

function MiniCrearProducto({ nombre, onConfirmar, onCancelar }: MiniCrearProductoProps) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!precio) return
    setSaving(true)
    try {
      const p = await createProducto({ nombre, precioDefault: parseFloat(precio) })
      onConfirmar(p)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2">
      <p className="text-sm font-medium text-[#1F2937] mb-2.5">Crear producto "{nombre}"</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[#6B7280] mb-1">Precio por defecto</label>
          <input
            type="number" min="0" step="0.01" autoFocus
            className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrear() } }}
            placeholder="0"
          />
        </div>
        <button
          type="button"
          disabled={saving || !precio}
          onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors"
        >
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Buscador de materias primas ────────────────────────────────────
interface BuscadorMpProps {
  materias: MateriaPrima[]
  gastosActuales: EventoGasto[]
  onAgregar: (mp: MateriaPrima) => void
  onCrearYAgregar: (nombre: string) => void
}

function BuscadorMateriaPrima({ materias, gastosActuales, onAgregar, onCrearYAgregar }: BuscadorMpProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const idsActuales = new Set(gastosActuales.map(g => g.materiaPrimaId))
  const filtradas = materias.filter(
    m => !idsActuales.has(m.id) && m.nombre.toLowerCase().includes(query.toLowerCase())
  )
  const mostrarCrear = query.trim().length > 0 && !materias.some(m => m.nombre.toLowerCase() === query.toLowerCase())

  return (
    <div ref={ref} className="relative">
      <input
        className={inputClass}
        placeholder="Buscar materia prima..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtradas.length > 0 || mostrarCrear) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtradas.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onAgregar(m); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{m.nombre}</span>
              <span className="text-[#6B7280] text-xs">{formatMonto(parseFloat(m.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button
              type="button"
              onClick={() => { onCrearYAgregar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form para crear materia prima inline (sin <form> anidado) ──
interface MiniCrearMpProps {
  nombre: string
  onConfirmar: (mp: MateriaPrima) => void
  onCancelar: () => void
}

function MiniCrearMateriaPrima({ nombre, onConfirmar, onCancelar }: MiniCrearMpProps) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!precio) return
    setSaving(true)
    try {
      const mp = await createMateriaPrima({ nombre, precioDefault: parseFloat(precio) })
      onConfirmar(mp)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2">
      <p className="text-sm font-medium text-[#1F2937] mb-2.5">Crear materia prima "{nombre}"</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[#6B7280] mb-1">Precio por defecto</label>
          <input
            type="number" min="0" step="0.01" autoFocus
            className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrear() } }}
            placeholder="0"
          />
        </div>
        <button
          type="button"
          disabled={saving || !precio}
          onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors"
        >
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Buscador de clientes ──────────────────────────────────────────
interface BuscadorClienteProps {
  clientes: Cliente[]
  seleccionado: ClienteRef | null
  onSeleccionar: (c: Cliente) => void
  onDeseleccionar: () => void
  onCrearYSeleccionar: (nombre: string) => void
}

function BuscadorCliente({ clientes, seleccionado, onSeleccionar, onDeseleccionar, onCrearYSeleccionar }: BuscadorClienteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (seleccionado) {
    return (
      <div className="flex items-center gap-2 border border-[#CFE6F7] rounded-xl px-3 py-2.5 bg-[#F7FAFC]">
        <span className="text-sm font-medium text-[#1F2937] flex-1">{seleccionado.nombre}</span>
        {seleccionado.telefono && (
          <a href={`tel:${seleccionado.telefono}`} className="text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors" onClick={e => e.stopPropagation()}>
            {seleccionado.telefono}
          </a>
        )}
        <button type="button" onClick={onDeseleccionar} className="text-[#6B7280] hover:text-[#1F2937] transition-colors shrink-0">
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  const q = query.toLowerCase()
  const filtrados = clientes.filter(
    c => c.nombre.toLowerCase().includes(q) || (c.telefono && c.telefono.includes(query))
  )
  const mostrarCrear = query.trim().length > 0 && !clientes.some(c => c.nombre.toLowerCase() === q)

  return (
    <div ref={ref} className="relative">
      <input
        className={inputClass}
        placeholder="Buscar cliente por nombre o teléfono..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtrados.length > 0 || mostrarCrear) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSeleccionar(c); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{c.nombre}</span>
              {c.telefono && <span className="text-[#6B7280] text-xs">{c.telefono}</span>}
            </button>
          ))}
          {mostrarCrear && (
            <button
              type="button"
              onClick={() => { onCrearYSeleccionar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form para crear cliente inline (sin <form> anidado) ────────
interface MiniCrearClienteProps {
  nombreInicial: string
  onConfirmar: (c: Cliente) => void
  onCancelar: () => void
}

function MiniCrearCliente({ nombreInicial, onConfirmar, onCancelar }: MiniCrearClienteProps) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!nombre) return
    setSaving(true)
    try {
      const c = await createCliente({
        nombre,
        telefono: telefono || undefined,
        direccion: direccion || undefined,
      })
      onConfirmar(c)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2 flex flex-col gap-2">
      <p className="text-sm font-medium text-[#1F2937]">Nuevo cliente</p>
      <input
        autoFocus
        className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
        placeholder="Nombre *"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
      />
      <input
        className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
        placeholder="Teléfono (opcional)"
        value={telefono}
        onChange={e => setTelefono(e.target.value)}
      />
      <input
        className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
        placeholder="Dirección (opcional)"
        value={direccion}
        onChange={e => setDireccion(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving || !nombre}
          onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors"
        >
          {saving ? '...' : 'Crear'}
        </button>
      </div>
    </div>
  )
}

// ── Fila de gasto (inline editable) ───────────────────────────────
interface GastoRowProps {
  gasto: EventoGasto
  eventoId: number
  onDelete: () => void
  onUpdate: (g: EventoGasto) => void
}

function GastoRow({ gasto, eventoId, onDelete, onUpdate }: GastoRowProps) {
  const [cantidad, setCantidad] = useState(gasto.cantidad)
  const [precio, setPrecio] = useState(gasto.precioUnitario)
  const [notas, setNotas] = useState(gasto.notas ?? '')

  async function save() {
    try {
      const updated = await updateEventoGasto(eventoId, gasto.id, {
        cantidad: parseFloat(cantidad) || 0,
        precioUnitario: parseFloat(precio) || 0,
        notas: notas || undefined,
      })
      onUpdate(updated)
    } catch { /* silent */ }
  }

  const subtotal = (parseFloat(cantidad) || 0) * (parseFloat(precio) || 0)

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl px-3 py-2.5">
      <span className="text-sm font-medium text-[#1F2937] flex-1 min-w-24">{gasto.materiaPrima.nombre}</span>
      <div className="flex items-center gap-2">
        <input
          type="number" min="0" step="0.01"
          className={`w-16 text-center ${inputInline}`}
          value={cantidad}
          onChange={e => setCantidad(e.target.value)}
          onBlur={save}
          title="Cantidad"
        />
        <span className="text-[#6B7280] text-xs">×</span>
        <input
          type="number" min="0" step="0.01"
          className={`w-24 text-right ${inputInline}`}
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          onBlur={save}
          title="Precio unitario"
        />
        <span className="text-sm font-semibold text-[#1F2937] w-24 text-right whitespace-nowrap">
          {formatMonto(subtotal)}
        </span>
      </div>
      <input
        className={`flex-1 min-w-28 text-xs ${inputInline}`}
        value={notas}
        onChange={e => setNotas(e.target.value)}
        onBlur={save}
        placeholder="Notas..."
      />
      <button onClick={onDelete} className="text-red-400 hover:text-red-600 transition-colors">
        <Trash2 size={13} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────
export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  const eventoId = parseInt(id!)
  const navigate = useNavigate()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [gastos, setGastos] = useState<EventoGasto[]>([])
  const [materias, setMaterias] = useState<MateriaPrima[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pedido | null>(null)
  const [form, setForm] = useState<PedidoFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [crearNombre, setCrearNombre] = useState<string | null>(null)
  const [crearClienteNombre, setCrearClienteNombre] = useState<string | null>(null)
  const [gastosOpen, setGastosOpen] = useState(true)
  const [crearMpNombre, setCrearMpNombre] = useState<string | null>(null)
  const [addingGasto, setAddingGasto] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [evs, peds, prods, gsts, mats, cls] = await Promise.all([
        getEventos(),
        getPedidos(eventoId),
        getProductos(),
        getEventoGastos(eventoId),
        getMateriasPrimas(),
        getClientes(),
      ])
      setEvento(evs.find(e => e.id === eventoId) ?? null)
      setPedidos(peds)
      setProductos(prods)
      setGastos(gsts)
      setMaterias(mats)
      setClientes(cls)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [eventoId])

  function openCreate() {
    setEditTarget(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEdit(p: Pedido) {
    setEditTarget(p)
    setForm({
      clienteId: p.clienteId,
      clienteRef: p.clienteId && p.cliente
        ? { id: p.cliente.id, nombre: p.cliente.nombre, telefono: p.cliente.telefono }
        : null,
      nombreCliente: p.nombreCliente,
      precioTotal: p.precioTotal,
      precioManual: true,
      estadoEntrega: p.estadoEntrega,
      estadoPago: p.estadoPago,
      notas: p.notas ?? '',
      montoSeña: p.montoSeña ?? '',
      items: p.productos.map(pp => ({
        productoId: pp.productoId,
        nombre: pp.producto.nombre,
        cantidad: pp.cantidad,
        precioUnitario: pp.precioUnitario,
      })),
    })
    setError('')
    setModalOpen(true)
  }

  function agregarItem(item: ItemForm) {
    setForm(f => {
      const items = [...f.items, item]
      const total = calcularTotal(items)
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(total), precioManual: false }
    })
  }

  function actualizarItem(idx: number, campo: 'cantidad' | 'precioUnitario', valor: string) {
    setForm(f => {
      const items = f.items.map((it, i) => i === idx ? { ...it, [campo]: campo === 'cantidad' ? parseInt(valor) || 1 : valor } : it)
      const total = calcularTotal(items)
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(total) }
    })
  }

  function quitarItem(idx: number) {
    setForm(f => {
      const items = f.items.filter((_, i) => i !== idx)
      const total = calcularTotal(items)
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(total) }
    })
  }

  function handlePrecioManual(valor: string) {
    setForm(f => ({ ...f, precioTotal: valor, precioManual: true }))
  }

  function resetPrecioAuto() {
    setForm(f => {
      const total = calcularTotal(f.items)
      return { ...f, precioTotal: String(total), precioManual: false }
    })
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este pedido?')) return
    await deletePedido(id)
    load()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreFinal = form.clienteRef ? form.clienteRef.nombre : form.nombreCliente
    if (!nombreFinal || !form.precioTotal) {
      setError('Cliente y precio total son requeridos')
      return
    }
    setSaving(true)
    setError('')
    const payload: PedidoInput = {
      nombreCliente: nombreFinal,
      telefono: form.clienteRef ? form.clienteRef.telefono || undefined : undefined,
      clienteId: form.clienteId,
      precioTotal: parseFloat(form.precioTotal),
      estadoEntrega: form.estadoEntrega,
      estadoPago: form.estadoPago,
      notas: form.notas || undefined,
      montoSeña: form.estadoPago === 'señado' && form.montoSeña ? parseFloat(form.montoSeña) : null,
    }
    try {
      if (editTarget) {
        await updatePedido(editTarget.id, payload)
        await Promise.all(editTarget.productos.map(pp => deletePedidoProducto(editTarget.id, pp.productoId).catch(() => {})))
        await Promise.all(form.items.map(it => addPedidoProducto(editTarget.id, {
          productoId: it.productoId,
          cantidad: it.cantidad,
          precioUnitario: parseFloat(it.precioUnitario),
        })))
      } else {
        const nuevo = await createPedido(eventoId, payload)
        await Promise.all(form.items.map(it => addPedidoProducto(nuevo.id, {
          productoId: it.productoId,
          cantidad: it.cantidad,
          precioUnitario: parseFloat(it.precioUnitario),
        })))
      }
      setModalOpen(false)
      load()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAgregarGasto(mp: MateriaPrima) {
    setAddingGasto(true)
    try {
      const gasto = await createEventoGasto(eventoId, {
        materiaPrimaId: mp.id,
        cantidad: 1,
        precioUnitario: parseFloat(mp.precioDefault),
      })
      setGastos(prev => [...prev, gasto])
    } finally {
      setAddingGasto(false)
    }
  }

  async function handleEliminarGasto(gastoId: number) {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteEventoGasto(eventoId, gastoId)
    setGastos(prev => prev.filter(g => g.id !== gastoId))
  }

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    if (a.estadoEntrega !== b.estadoEntrega) return a.estadoEntrega === 'pendiente' ? -1 : 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const totalEsperado = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const totalCobrado = pedidos
    .filter(p => p.estadoPago === 'pagado')
    .reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const totalSenas = pedidos
    .filter(p => p.estadoPago === 'señado' && p.montoSeña)
    .reduce((s, p) => s + parseFloat(p.montoSeña!), 0)
  const totalRecibido = totalCobrado + totalSenas
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pagados = pedidos.filter(p => p.estadoPago === 'pagado').length
  const totalGastos = gastos.reduce((s, g) => s + g.subtotal, 0)
  const gananciaNeta = totalRecibido - totalGastos
  const gananciaEsperada = totalEsperado - totalGastos

  if (loading) return <LoadingSpinner fullscreen />
  if (!evento) return <p className="p-6 text-sm text-red-500">Evento no encontrado.</p>

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] mb-5 transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Eventos
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1F2937]">{evento.nombre}</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Calendar size={13} color="#9CC6EA" strokeWidth={2} />
          <p className="text-sm text-[#6B7280]">{formatFecha(evento.fecha)}</p>
        </div>
        {evento.descripcion && (
          <p className="text-sm text-[#6B7280] mt-1">{evento.descripcion}</p>
        )}
      </div>

      {/* Fila 1 — Ingresos */}
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Ingresos</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <ShoppingCart size={13} color="#9CC6EA" strokeWidth={2} />
            <p className="text-xs text-[#6B7280]">Pedidos</p>
          </div>
          <p className="text-2xl font-semibold text-[#1F2937]">{pedidos.length}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Truck size={13} color="#9CC6EA" strokeWidth={2} />
            <p className="text-xs text-[#6B7280]">Entregados</p>
          </div>
          <p className="text-2xl font-semibold text-[#1F2937]">{entregados}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign size={13} color="#9CC6EA" strokeWidth={2} />
            <p className="text-xs text-[#6B7280]">Total esperado</p>
          </div>
          <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalEsperado)}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard size={13} color="#10b981" strokeWidth={2} />
            <p className="text-xs text-[#6B7280]">Recibido</p>
          </div>
          <p className="text-lg font-semibold text-emerald-600">{formatMonto(totalRecibido)}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">{pagados} pagados{totalSenas > 0 ? ` + ${formatMonto(totalSenas)} señas` : ''}</p>
        </div>
      </div>

      {/* Fila 2 — Rentabilidad */}
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Rentabilidad</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <FlaskConical size={13} color="#9CC6EA" strokeWidth={2} />
            <p className="text-xs text-[#6B7280]">Total gastos</p>
          </div>
          <p className="text-lg font-semibold text-[#1F2937]">{formatMonto(totalGastos)}</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {gananciaNeta >= 0
              ? <TrendingUp size={13} color="#10b981" strokeWidth={2} />
              : <TrendingDown size={13} color="#ef4444" strokeWidth={2} />
            }
            <p className="text-xs text-[#6B7280]">Ganancia neta</p>
          </div>
          <p className={`text-lg font-semibold ${gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatMonto(gananciaNeta)}
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">recibido − gastos</p>
        </div>
        <div className="bg-white border border-[#E5EAF1] rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {gananciaEsperada >= 0
              ? <TrendingUp size={13} color="#9CC6EA" strokeWidth={2} />
              : <TrendingDown size={13} color="#f59e0b" strokeWidth={2} />
            }
            <p className="text-xs text-[#6B7280]">Ganancia esperada</p>
          </div>
          <p className={`text-lg font-semibold ${gananciaEsperada >= 0 ? 'text-[#1F2937]' : 'text-amber-500'}`}>
            {formatMonto(gananciaEsperada)}
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">total − gastos</p>
        </div>
      </div>

      <hr className="border-t border-[#E5EAF1] mb-5" />

      {/* Sección gastos */}
      <div className="mb-5">
        <button
          onClick={() => setGastosOpen(o => !o)}
          className="flex items-center gap-2 w-full text-left mb-3"
        >
          {gastosOpen ? <ChevronDown size={15} color="#9CC6EA" strokeWidth={2} /> : <ChevronRight size={15} color="#9CC6EA" strokeWidth={2} />}
          <FlaskConical size={15} color="#9CC6EA" strokeWidth={2} />
          <span className="font-semibold text-[#1F2937]">Gastos del evento</span>
          {totalGastos > 0 && (
            <span className="ml-auto text-sm font-semibold text-[#1F2937]">{formatMonto(totalGastos)}</span>
          )}
        </button>

        {gastosOpen && (
          <div className="flex flex-col gap-2">
            {gastos.map(g => (
              <GastoRow
                key={g.id}
                gasto={g}
                eventoId={eventoId}
                onDelete={() => handleEliminarGasto(g.id)}
                onUpdate={updated => setGastos(prev => prev.map(x => x.id === updated.id ? updated : x))}
              />
            ))}

            {gastos.length === 0 && (
              <p className="text-sm text-[#6B7280] py-2">No hay gastos registrados para este evento.</p>
            )}

            {gastos.length > 0 && (
              <div className="flex justify-end pt-1 border-t border-[#E5EAF1]">
                <span className="text-sm font-semibold text-[#1F2937]">
                  Total: {formatMonto(totalGastos)}
                </span>
              </div>
            )}

            <div className="mt-2">
              <BuscadorMateriaPrima
                materias={materias}
                gastosActuales={gastos}
                onAgregar={handleAgregarGasto}
                onCrearYAgregar={nombre => setCrearMpNombre(nombre)}
              />
              {addingGasto && <p className="text-xs text-[#6B7280] mt-1">Agregando...</p>}
              {crearMpNombre && (
                <MiniCrearMateriaPrima
                  nombre={crearMpNombre}
                  onConfirmar={mp => {
                    setMaterias(prev => [...prev, mp].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                    handleAgregarGasto(mp)
                    setCrearMpNombre(null)
                  }}
                  onCancelar={() => setCrearMpNombre(null)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <hr className="border-t border-[#E5EAF1] mb-5" />

      {/* Encabezado pedidos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-[#1F2937] flex items-center gap-2">
          <ShoppingCart size={15} color="#9CC6EA" strokeWidth={2} />
          Pedidos
        </h2>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={14} strokeWidth={2.5} />
          Nuevo pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280]">
          <ShoppingCart size={28} className="mx-auto mb-3 text-[#E5EAF1]" strokeWidth={1.5} />
          <p className="text-sm">No hay pedidos para este evento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {pedidosOrdenados.map((p) => {
            const precio = parseFloat(p.precioTotal)
            const sena = p.montoSeña ? parseFloat(p.montoSeña) : null
            const resta = sena !== null ? precio - sena : null
            return (
              <div key={p.id} className="bg-white border border-[#E5EAF1] rounded-2xl px-5 py-4 hover:border-[#9CC6EA] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1F2937]">{p.nombreCliente}</p>
                    {(p.cliente?.telefono || p.telefono) && (
                      <a
                        href={`tel:${p.cliente?.telefono ?? p.telefono}`}
                        className="text-xs text-[#6B7280] hover:text-[#1F2937] mt-0.5 block transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        {p.cliente?.telefono ?? p.telefono}
                      </a>
                    )}
                    {p.productos.length > 0 ? (
                      <p className="text-sm text-[#6B7280] mt-1.5">
                        {p.productos.map(pp => `${pp.producto.nombre} × ${pp.cantidad}`).join(' — ')}
                      </p>
                    ) : p.descripcion ? (
                      <p className="text-sm text-[#6B7280] mt-1.5">{p.descripcion}</p>
                    ) : null}
                    {p.notas && <p className="text-xs text-[#6B7280] mt-1 italic">{p.notas}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#1F2937]">{formatMonto(precio)}</p>
                    {sena !== null && resta !== null && (
                      <div className="mt-0.5">
                        <p className="text-xs text-[#6B7280]">Seña: {formatMonto(sena)}</p>
                        <p className="text-xs font-medium text-amber-600">Resta: {formatMonto(resta)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5EAF1]">
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeEntrega(p.estadoEntrega)}`}>
                      {etiquetaEntrega[p.estadoEntrega]}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgePago(p.estadoPago)}`}>
                      {etiquetaPago[p.estadoPago]}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1F2937] transition-colors px-2 py-1 rounded-lg hover:bg-[#F7FAFC]"
                    >
                      <Pencil size={11} strokeWidth={2} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={11} strokeWidth={2} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal pedido */}
      {modalOpen && (
        <Modal title={editTarget ? 'Editar pedido' : 'Nuevo pedido'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Cliente</label>
              <BuscadorCliente
                clientes={clientes}
                seleccionado={form.clienteRef}
                onSeleccionar={c => setForm(f => ({
                  ...f,
                  clienteId: c.id,
                  clienteRef: { id: c.id, nombre: c.nombre, telefono: c.telefono },
                  nombreCliente: c.nombre,
                }))}
                onDeseleccionar={() => setForm(f => ({
                  ...f,
                  clienteId: null,
                  clienteRef: null,
                  nombreCliente: '',
                }))}
                onCrearYSeleccionar={nombre => setCrearClienteNombre(nombre)}
              />
              {crearClienteNombre && (
                <MiniCrearCliente
                  nombreInicial={crearClienteNombre}
                  onConfirmar={c => {
                    setClientes(prev => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                    setForm(f => ({
                      ...f,
                      clienteId: c.id,
                      clienteRef: { id: c.id, nombre: c.nombre, telefono: c.telefono },
                      nombreCliente: c.nombre,
                    }))
                    setCrearClienteNombre(null)
                  }}
                  onCancelar={() => setCrearClienteNombre(null)}
                />
              )}
            </div>

            <div>
              <label className={labelClass}>Productos</label>
              {form.items.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {form.items.map((item, idx) => (
                    <div key={item.productoId} className="flex items-center gap-2 bg-[#F7FAFC] border border-[#E5EAF1] rounded-xl px-3 py-2">
                      <span className="text-sm text-[#1F2937] flex-1 truncate">{item.nombre}</span>
                      <input
                        type="number" min="1"
                        className="w-14 border border-[#E5EAF1] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
                        value={item.cantidad}
                        onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                      />
                      <span className="text-[#6B7280] text-xs">×</span>
                      <input
                        type="number" min="0" step="0.01"
                        className="w-24 border border-[#E5EAF1] rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
                        value={item.precioUnitario}
                        onChange={e => actualizarItem(idx, 'precioUnitario', e.target.value)}
                      />
                      <button type="button" onClick={() => quitarItem(idx)} className="text-[#6B7280] hover:text-red-500 transition-colors ml-1">
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <BuscadorProductos
                productos={productos}
                itemsActuales={form.items}
                onAgregar={agregarItem}
                onCrearYAgregar={nombre => setCrearNombre(nombre)}
              />
              {crearNombre && (
                <MiniCrearProducto
                  nombre={crearNombre}
                  onConfirmar={p => {
                    setProductos(prev => [...prev, p].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                    agregarItem({ productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: p.precioDefault })
                    setCrearNombre(null)
                  }}
                  onCancelar={() => setCrearNombre(null)}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#1F2937]">Precio total</label>
                {form.precioManual && form.items.length > 0 && (
                  <button
                    type="button"
                    onClick={resetPrecioAuto}
                    className="flex items-center gap-1 text-xs text-[#9CC6EA] hover:text-[#1F2937] transition-colors"
                  >
                    <RefreshCw size={11} strokeWidth={2} />
                    Usar suma ({formatMonto(calcularTotal(form.items))})
                  </button>
                )}
              </div>
              <input
                type="number" min="0" step="0.01"
                className={inputClass}
                value={form.precioTotal}
                onChange={e => handlePrecioManual(e.target.value)}
                placeholder="0"
              />
              {!form.precioManual && form.items.length > 0 && (
                <p className="text-xs text-[#6B7280] mt-1">Calculado automáticamente desde los productos</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Estado entrega</label>
                <select
                  className={inputClass}
                  value={form.estadoEntrega}
                  onChange={e => setForm(f => ({ ...f, estadoEntrega: e.target.value as EstadoEntrega }))}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado pago</label>
                <select
                  className={inputClass}
                  value={form.estadoPago}
                  onChange={e => setForm(f => ({ ...f, estadoPago: e.target.value as EstadoPago, montoSeña: '' }))}
                >
                  <option value="sin_seña">Sin seña</option>
                  <option value="señado">Señado</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>

            {form.estadoPago === 'señado' && (
              <div>
                <label className={labelClass}>Monto de seña</label>
                <input
                  type="number" min="0" step="0.01"
                  className={inputClass}
                  value={form.montoSeña}
                  onChange={e => setForm(f => ({ ...f, montoSeña: e.target.value }))}
                  placeholder="0"
                />
                {form.montoSeña && form.precioTotal && (
                  <p className="text-xs text-amber-600 mt-1">
                    Resta: {formatMonto(parseFloat(form.precioTotal) - parseFloat(form.montoSeña))}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className={labelClass}>
                Notas <span className="text-[#6B7280] font-normal">(opcional)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Sin gluten, entrega a domicilio, etc."
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
                {saving ? <><LoadingSpinner inline /><span>Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear pedido'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
