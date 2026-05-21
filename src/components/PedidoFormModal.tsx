import { useEffect, useRef, useState } from 'react'
import { Plus, X, RefreshCw, AlertTriangle } from 'lucide-react'
import { Pedido, PedidoConEvento, PedidoInput, EstadoEntrega, EstadoPago, createPedidoStandalone, updatePedido } from '../api/pedidos'
import { Producto, getProductos, createProducto, addPedidoProducto, deletePedidoProducto } from '../api/productos'
import { Cliente, getClientes, createCliente } from '../api/clientes'
import { Evento, getEventos } from '../api/eventos'
import LoadingSpinner from './LoadingSpinner'

interface ItemForm {
  productoId: number
  nombre: string
  cantidad: number
  precioUnitario: string
}

type ClienteRef = { id: number; nombre: string; telefono: string | null }

interface FormState {
  eventoId: number | null
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

const emptyForm = (eventoIdDefault: number | null): FormState => ({
  eventoId: eventoIdDefault,
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
})

const inputClass = 'w-full border border-[#E5EAF1] rounded-xl px-3 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors bg-white'
const labelClass = 'block text-sm font-medium text-[#1F2937] mb-1.5'
const btnPrimary = 'bg-[#1F2937] text-white text-sm px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors flex items-center gap-2'
const btnGhost = 'text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors px-3 py-2.5'

const formatMonto = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

function calcularTotal(items: ItemForm[]) {
  return items.reduce((s, i) => s + i.cantidad * (parseFloat(i.precioUnitario) || 0), 0)
}

// ── Buscador de productos ─────────────────────────────────────────
function BuscadorProductos({
  productos, itemsActuales, onAgregar, onCrearYAgregar,
}: {
  productos: Producto[]
  itemsActuales: ItemForm[]
  onAgregar: (item: ItemForm) => void
  onCrearYAgregar: (nombre: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const idsActuales = new Set(itemsActuales.map(i => i.productoId))
  const filtrados = productos.filter(p => !idsActuales.has(p.id) && p.nombre.toLowerCase().includes(query.toLowerCase()))
  const mostrarCrear = query.trim().length > 0 && !productos.some(p => p.nombre.toLowerCase() === query.toLowerCase())

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full border-0 bg-transparent text-sm text-[#1F2937] placeholder-[#9CC6EA] focus:outline-none"
        placeholder="+ Agregar producto..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtrados.length > 0 || mostrarCrear) && (
        <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map(p => (
            <button key={p.id} type="button"
              onClick={() => { onAgregar({ productoId: p.id, nombre: p.nombre, cantidad: 1, precioUnitario: p.precioDefault }); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{p.nombre}</span>
              <span className="text-[#6B7280] text-xs">{formatMonto(parseFloat(p.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button type="button"
              onClick={() => { onCrearYAgregar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} /> Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form crear producto inline ────────────────────────────────
function MiniCrearProducto({ nombre, onConfirmar, onCancelar }: { nombre: string; onConfirmar: (p: Producto) => void; onCancelar: () => void }) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!precio) return
    setSaving(true)
    try { onConfirmar(await createProducto({ nombre, precioDefault: parseFloat(precio) })) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2">
      <p className="text-sm font-medium text-[#1F2937] mb-2.5">Crear producto "{nombre}"</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-[#6B7280] mb-1">Precio por defecto</label>
          <input type="number" min="0" step="0.01" autoFocus placeholder="0"
            className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
            value={precio} onChange={e => setPrecio(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrear() } }}
          />
        </div>
        <button type="button" disabled={saving || !precio} onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">Cancelar</button>
      </div>
    </div>
  )
}

// ── Buscador de clientes ──────────────────────────────────────────
function BuscadorCliente({
  clientes, seleccionado, onSeleccionar, onDeseleccionar, onCrearYSeleccionar,
}: {
  clientes: Cliente[]
  seleccionado: ClienteRef | null
  onSeleccionar: (c: Cliente) => void
  onDeseleccionar: () => void
  onCrearYSeleccionar: (nombre: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
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
  const filtrados = clientes.filter(c => c.nombre.toLowerCase().includes(q) || (c.telefono && c.telefono.includes(query)))
  const mostrarCrear = query.trim().length > 0 && !clientes.some(c => c.nombre.toLowerCase() === q)

  return (
    <div ref={ref} className="relative">
      <input className={inputClass} placeholder="Buscar cliente por nombre o teléfono..."
        value={query} onChange={e => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
      />
      {open && (filtrados.length > 0 || mostrarCrear) && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E5EAF1] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map(c => (
            <button key={c.id} type="button"
              onClick={() => { onSeleccionar(c); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F7FAFC] flex justify-between items-center transition-colors"
            >
              <span className="text-[#1F2937]">{c.nombre}</span>
              {c.telefono && <span className="text-[#6B7280] text-xs">{c.telefono}</span>}
            </button>
          ))}
          {mostrarCrear && (
            <button type="button"
              onClick={() => { onCrearYSeleccionar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm text-[#9CC6EA] hover:bg-[#F7FAFC] border-t border-[#E5EAF1] flex items-center gap-1.5 transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} /> Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form crear cliente inline ────────────────────────────────
function MiniCrearCliente({ nombreInicial, onConfirmar, onCancelar }: { nombreInicial: string; onConfirmar: (c: Cliente) => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCrear() {
    if (!nombre) return
    setSaving(true)
    try { onConfirmar(await createCliente({ nombre, telefono: telefono || undefined, direccion: direccion || undefined })) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-[#F7FAFC] border border-[#CFE6F7] rounded-xl p-3 mt-2 flex flex-col gap-2">
      <p className="text-sm font-medium text-[#1F2937]">Nuevo cliente</p>
      <input autoFocus className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors" placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)} />
      <input className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors" placeholder="Teléfono (opcional)" value={telefono} onChange={e => setTelefono(e.target.value)} />
      <input className="w-full border border-[#E5EAF1] rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors" placeholder="Dirección (opcional)" value={direccion} onChange={e => setDireccion(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar} className="text-xs text-[#6B7280] hover:text-[#1F2937] px-2 py-2 transition-colors">Cancelar</button>
        <button type="button" disabled={saving || !nombre} onClick={handleCrear}
          className="bg-[#1F2937] text-white text-xs px-3 py-2 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors">
          {saving ? '...' : 'Crear'}
        </button>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (pedido?: PedidoConEvento) => void
  editTarget?: Pedido | null
  eventoIdDefault?: number | null
}

export default function PedidoFormModal({ isOpen, onClose, onSaved, editTarget, eventoIdDefault = null }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [form, setForm] = useState<FormState>(emptyForm(eventoIdDefault))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [crearNombre, setCrearNombre] = useState<string | null>(null)
  const [crearClienteNombre, setCrearClienteNombre] = useState<string | null>(null)
  const [pagoAlertDismissed, setPagoAlertDismissed] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    Promise.all([getProductos(), getClientes(), getEventos()]).then(([prods, cls, evs]) => {
      setProductos(prods)
      setClientes(cls)
      setEventos(evs)
    })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (editTarget) {
      const items = editTarget.productos.map(pp => ({
        productoId: pp.productoId,
        nombre: pp.producto.nombre,
        cantidad: pp.cantidad,
        precioUnitario: pp.precioUnitario,
      }))
      const calculado = calcularTotal(items)
      const guardado = parseFloat(editTarget.precioTotal)
      setForm({
        eventoId: editTarget.eventoId,
        clienteId: editTarget.clienteId,
        clienteRef: editTarget.clienteId && editTarget.cliente
          ? { id: editTarget.cliente.id, nombre: editTarget.cliente.nombre, telefono: editTarget.cliente.telefono }
          : null,
        nombreCliente: editTarget.nombreCliente,
        precioTotal: editTarget.precioTotal,
        precioManual: Math.abs(calculado - guardado) > 0.01,
        estadoEntrega: editTarget.estadoEntrega,
        estadoPago: editTarget.estadoPago,
        notas: editTarget.notas ?? '',
        montoSeña: editTarget.montoSeña ?? '',
        items,
      })
    } else {
      setForm(emptyForm(eventoIdDefault))
    }
    setError('')
    setCrearNombre(null)
    setCrearClienteNombre(null)
    setPagoAlertDismissed(false)
  }, [isOpen, editTarget])

  function agregarItem(item: ItemForm) {
    setForm(f => {
      const items = [...f.items, item]
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(calcularTotal(items)), precioManual: false }
    })
  }

  function actualizarItem(idx: number, campo: 'cantidad' | 'precioUnitario', valor: string) {
    setForm(f => {
      const items = f.items.map((it, i) => i === idx ? { ...it, [campo]: campo === 'cantidad' ? parseInt(valor) || 1 : valor } : it)
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(calcularTotal(items)) }
    })
  }

  function quitarItem(idx: number) {
    setForm(f => {
      const items = f.items.filter((_, i) => i !== idx)
      return { ...f, items, precioTotal: f.precioManual ? f.precioTotal : String(calcularTotal(items)) }
    })
  }

  function resetToAuto() {
    setForm(f => ({ ...f, precioTotal: String(calcularTotal(f.items)), precioManual: false }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreFinal = form.clienteRef ? form.clienteRef.nombre : form.nombreCliente
    if (!nombreFinal || !form.precioTotal) { setError('Cliente y precio total son requeridos'); return }
    setSaving(true)
    setError('')
    const payload: PedidoInput = {
      nombreCliente: nombreFinal,
      telefono: form.clienteRef ? form.clienteRef.telefono || undefined : undefined,
      clienteId: form.clienteId,
      eventoId: form.eventoId,
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
        await Promise.all(form.items.map(it => addPedidoProducto(editTarget.id, { productoId: it.productoId, cantidad: it.cantidad, precioUnitario: parseFloat(it.precioUnitario) })))
        onSaved()
      } else {
        const nuevo = await createPedidoStandalone(payload)
        await Promise.all(form.items.map(it => addPedidoProducto(nuevo.id, { productoId: it.productoId, cantidad: it.cantidad, precioUnitario: parseFloat(it.precioUnitario) })))
        const pedidoParaModal: PedidoConEvento = {
          ...nuevo,
          productos: form.items.map((item, idx) => ({
            id: idx,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            producto: { id: item.productoId, nombre: item.nombre, descripcion: null, precioDefault: item.precioUnitario },
          })),
          evento: form.eventoId ? (eventos.find(e => e.id === form.eventoId) ?? null) : null,
          cliente: form.clienteRef ?? null,
        }
        onSaved(pedidoParaModal)
      }
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const totalCalculado = calcularTotal(form.items)
  const mostrarManual = form.precioManual && form.items.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg md:max-w-[860px] lg:max-w-[1160px] max-h-[90vh] flex flex-col border border-[#E5EAF1]">

        {/* Header */}
        <div className="flex-none flex items-center justify-between px-5 md:px-6 lg:px-8 py-4 border-b-2 border-[#9CC6EA]">
          <h2 className="font-semibold text-[#1F2937] text-base">
            {editTarget ? 'Editar pedido' : 'Nuevo pedido'}
          </h2>
          <button type="button" onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F7FAFC] transition-colors">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Form = scrollable body + footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 md:px-6 lg:px-8 py-5 lg:py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 lg:gap-12 lg:grid-cols-[1fr_1.4fr]">

              {/* ── Columna izquierda: Quién y cuándo ── */}
              <div className="flex flex-col gap-4">

                {/* Cliente */}
                <div>
                  <label className={labelClass}>Cliente</label>
                  <BuscadorCliente
                    clientes={clientes}
                    seleccionado={form.clienteRef}
                    onSeleccionar={c => setForm(f => ({ ...f, clienteId: c.id, clienteRef: { id: c.id, nombre: c.nombre, telefono: c.telefono }, nombreCliente: c.nombre }))}
                    onDeseleccionar={() => setForm(f => ({ ...f, clienteId: null, clienteRef: null, nombreCliente: '' }))}
                    onCrearYSeleccionar={nombre => setCrearClienteNombre(nombre)}
                  />
                  {crearClienteNombre && (
                    <MiniCrearCliente
                      nombreInicial={crearClienteNombre}
                      onConfirmar={c => {
                        setClientes(prev => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                        setForm(f => ({ ...f, clienteId: c.id, clienteRef: { id: c.id, nombre: c.nombre, telefono: c.telefono }, nombreCliente: c.nombre }))
                        setCrearClienteNombre(null)
                      }}
                      onCancelar={() => setCrearClienteNombre(null)}
                    />
                  )}
                </div>

                {/* Evento */}
                <div>
                  <label className={labelClass}>
                    Evento <span className="text-[#6B7280] font-normal">(opcional)</span>
                  </label>
                  <select className={inputClass}
                    value={form.eventoId ?? ''}
                    onChange={e => setForm(f => ({ ...f, eventoId: e.target.value ? parseInt(e.target.value) : null }))}>
                    <option value="">Sin evento</option>
                    {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                  </select>
                </div>

                {/* Estados */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Entrega</label>
                    <select className={inputClass} value={form.estadoEntrega}
                      onChange={e => setForm(f => ({ ...f, estadoEntrega: e.target.value as EstadoEntrega }))}>
                      <option value="pendiente">Pendiente</option>
                      <option value="entregado">Entregado</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Pago</label>
                    <select className={inputClass} value={form.estadoPago}
                      onChange={e => setForm(f => ({ ...f, estadoPago: e.target.value as EstadoPago, montoSeña: '' }))}>
                      <option value="sin_seña">Pendiente</option>
                      <option value="señado">Señado</option>
                      <option value="pagado">Pagado</option>
                    </select>
                  </div>
                </div>

                {/* Monto seña */}
                {form.estadoPago === 'señado' && (
                  <div>
                    <label className={labelClass}>Monto de seña</label>
                    <input type="number" min="0" step="0.01" placeholder="0" className={inputClass}
                      value={form.montoSeña} onChange={e => setForm(f => ({ ...f, montoSeña: e.target.value }))}
                    />
                    {form.montoSeña && form.precioTotal && (
                      <p className="text-xs text-amber-600 mt-1">
                        Resta: {formatMonto(parseFloat(form.precioTotal) - parseFloat(form.montoSeña))}
                      </p>
                    )}
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className={labelClass}>
                    Notas <span className="text-[#6B7280] font-normal">(opcional)</span>
                  </label>
                  <textarea className={`${inputClass} resize-none`} rows={3}
                    value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Sin gluten, entrega a domicilio, etc."
                  />
                </div>
              </div>

              {/* ── Columna derecha: Qué y cuánto ── */}
              <div className="flex flex-col gap-4 mt-6 md:mt-0">

                {/* Tabla de productos */}
                <div>
                  <label className={labelClass}>Productos</label>
                  <div className="border border-[#E5EAF1] rounded-xl overflow-visible">
                    {form.items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[#F7FAFC] border-b border-[#E5EAF1] text-xs text-[#6B7280] font-medium">
                              <th className="text-left px-3 py-2">Producto</th>
                              <th className="text-center px-2 py-2 w-16">Cant.</th>
                              <th className="text-right px-2 py-2 w-28">Precio u.</th>
                              <th className="text-right px-3 py-2 w-28">Subtotal</th>
                              <th className="w-8 px-2 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F7FAFC]">
                            {form.items.map((item, idx) => (
                              <tr key={item.productoId} className="group">
                                <td className="px-3 py-2 text-sm text-[#1F2937] max-w-[120px]">
                                  <span className="block truncate" title={item.nombre}>{item.nombre}</span>
                                </td>
                                <td className="px-2 py-1.5">
                                  <input type="number" min="1"
                                    className="w-full text-center border border-[#E5EAF1] rounded-lg px-1.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
                                    value={item.cantidad}
                                    onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input type="number" min="0" step="0.01"
                                    className="w-full text-right border border-[#E5EAF1] rounded-lg px-1.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9CC6EA] transition-colors"
                                    value={item.precioUnitario}
                                    onChange={e => actualizarItem(idx, 'precioUnitario', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2 text-right text-sm font-medium text-[#1F2937] whitespace-nowrap">
                                  {formatMonto(item.cantidad * (parseFloat(item.precioUnitario) || 0))}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button type="button" onClick={() => quitarItem(idx)}
                                    className="text-[#E5EAF1] hover:text-red-400 transition-colors">
                                    <X size={14} strokeWidth={2} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Fila de búsqueda */}
                    <div className={`px-3 py-2.5 ${form.items.length > 0 ? 'border-t border-[#E5EAF1]' : ''}`}>
                      <BuscadorProductos
                        productos={productos}
                        itemsActuales={form.items}
                        onAgregar={agregarItem}
                        onCrearYAgregar={nombre => setCrearNombre(nombre)}
                      />
                    </div>
                  </div>

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

                {/* Total */}
                <div className="border-t border-[#E5EAF1] pt-4">
                  {form.items.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-[#6B7280]">Total calculado</span>
                      <span className="text-sm font-semibold text-[#1F2937]">{formatMonto(totalCalculado)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-[#1F2937]">Precio total</label>
                      {mostrarManual && (
                        <button type="button" onClick={resetToAuto}
                          className="flex items-center gap-1 text-xs text-[#9CC6EA] hover:text-[#1F2937] transition-colors">
                          <RefreshCw size={11} strokeWidth={2} />
                          Usar calculado
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" step="0.01" placeholder="0"
                        className={`${inputClass} ${mostrarManual ? 'border-amber-300 focus:ring-amber-300' : ''}`}
                        value={form.precioTotal}
                        onChange={e => setForm(f => ({ ...f, precioTotal: e.target.value, precioManual: true }))}
                      />
                      {mostrarManual && (
                        <span className="shrink-0 text-xs font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap">
                          Editado
                        </span>
                      )}
                    </div>
                    {!form.precioManual && form.items.length > 0 && (
                      <p className="text-xs text-[#6B7280] mt-1">Calculado automáticamente desde los productos</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Alerta: pedido pagado con total modificado */}
          {editTarget && editTarget.estadoPago === 'pagado' && !pagoAlertDismissed &&
           Math.abs(parseFloat(form.precioTotal || '0') - parseFloat(editTarget.precioTotal)) > 0.01 && (
            <div className="mx-5 md:mx-6 lg:mx-8 mb-0 mt-0 py-3 border-t border-amber-200">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Total modificado en pedido pagado</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Estaba pagado por {formatMonto(parseFloat(editTarget.precioTotal))}. El nuevo total es {formatMonto(parseFloat(form.precioTotal || '0'))}.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, estadoPago: 'señado', montoSeña: editTarget.precioTotal }))
                      setPagoAlertDismissed(true)
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  >
                    Mover a señado · seña {formatMonto(parseFloat(editTarget.precioTotal))}
                  </button>
                  <button type="button"
                    onClick={() => setPagoAlertDismissed(true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    Mantener pagado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex-none px-5 md:px-6 lg:px-8 py-4 border-t border-[#E5EAF1]">
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {error}
              </p>
            )}
            <div className="flex items-center justify-between">
              <button type="button" onClick={onClose} className={btnGhost}>Cancelar</button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving
                  ? <><LoadingSpinner inline /><span>Guardando...</span></>
                  : editTarget ? 'Guardar cambios' : 'Crear pedido'
                }
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
