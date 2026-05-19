import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Evento, getEventos } from '../api/eventos'
import { Pedido, PedidoInput, EstadoEntrega, EstadoPago, getPedidos, createPedido, updatePedido, deletePedido } from '../api/pedidos'
import { Producto, getProductos, createProducto, addPedidoProducto, deletePedidoProducto, updatePedidoProducto } from '../api/productos'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

interface ItemForm {
  productoId: number
  nombre: string
  cantidad: number
  precioUnitario: string
}

interface PedidoFormState {
  nombreCliente: string
  telefono: string
  precioTotal: string
  precioManual: boolean
  estadoEntrega: EstadoEntrega
  estadoPago: EstadoPago
  notas: string
  items: ItemForm[]
}

const emptyForm: PedidoFormState = {
  nombreCliente: '',
  telefono: '',
  precioTotal: '',
  precioManual: false,
  estadoEntrega: 'pendiente',
  estadoPago: 'sin_seña',
  notas: '',
  items: [],
}

const etiquetaEntrega: Record<EstadoEntrega, string> = { pendiente: 'Pendiente', entregado: 'Entregado' }
const etiquetaPago: Record<EstadoPago, string> = { sin_seña: 'Sin seña', señado: 'Señado', pagado: 'Pagado' }
const badgeEntrega = (e: EstadoEntrega) => e === 'entregado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
const badgePago = (e: EstadoPago) => e === 'pagado' ? 'bg-green-100 text-green-700' : e === 'señado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
const formatMonto = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

function calcularTotal(items: ItemForm[]): number {
  return items.reduce((s, i) => s + i.cantidad * (parseFloat(i.precioUnitario) || 0), 0)
}

// ── Buscador de productos ──────────────────────────────────────────
interface BuscadorProps {
  productos: Producto[]
  itemsActuales: ItemForm[]
  onAgregar: (item: ItemForm) => void
  onCrearYAgregar: (nombre: string) => void
}

function BuscadorProductos({ productos, itemsActuales, onAgregar, onCrearYAgregar }: BuscadorProps) {
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        placeholder="Buscar producto..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtrados.length > 0 || mostrarCrear) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtrados.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => seleccionar(p)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center"
            >
              <span>{p.nombre}</span>
              <span className="text-gray-400 text-xs">{formatMonto(parseFloat(p.precioDefault))}</span>
            </button>
          ))}
          {mostrarCrear && (
            <button
              type="button"
              onClick={() => { onCrearYAgregar(query.trim()); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100"
            >
              + Crear "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini-form para crear producto nuevo inline ─────────────────────
interface MiniCrearProps {
  nombre: string
  onConfirmar: (producto: Producto) => void
  onCancelar: () => void
}

function MiniCrearProducto({ nombre, onConfirmar, onCancelar }: MiniCrearProps) {
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
      <p className="text-sm font-medium text-blue-800 mb-2">Crear producto "{nombre}"</p>
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-blue-700 mb-1">Precio por defecto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="w-full border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="0"
          />
        </div>
        <button type="submit" disabled={saving || !precio} className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={onCancelar} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-2">
          Cancelar
        </button>
      </form>
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
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pedido | null>(null)
  const [form, setForm] = useState<PedidoFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [crearNombre, setCrearNombre] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [evs, peds, prods] = await Promise.all([getEventos(), getPedidos(eventoId), getProductos()])
      setEvento(evs.find(e => e.id === eventoId) ?? null)
      setPedidos(peds)
      setProductos(prods)
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
      nombreCliente: p.nombreCliente,
      telefono: p.telefono ?? '',
      precioTotal: p.precioTotal,
      precioManual: true,
      estadoEntrega: p.estadoEntrega,
      estadoPago: p.estadoPago,
      notas: p.notas ?? '',
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
    if (!form.nombreCliente || !form.precioTotal) {
      setError('Cliente y precio total son requeridos')
      return
    }
    setSaving(true)
    setError('')
    const payload: PedidoInput = {
      nombreCliente: form.nombreCliente,
      telefono: form.telefono || undefined,
      precioTotal: parseFloat(form.precioTotal),
      estadoEntrega: form.estadoEntrega,
      estadoPago: form.estadoPago,
      notas: form.notas || undefined,
    }
    try {
      if (editTarget) {
        await updatePedido(editTarget.id, payload)
        // Sync productos: borrar todos y re-crear
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

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    if (a.estadoEntrega !== b.estadoEntrega) return a.estadoEntrega === 'pendiente' ? -1 : 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const totalMonto = pedidos.reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const cobrado = pedidos.filter(p => p.estadoPago === 'pagado').reduce((s, p) => s + parseFloat(p.precioTotal), 0)
  const entregados = pedidos.filter(p => p.estadoEntrega === 'entregado').length
  const pagados = pedidos.filter(p => p.estadoPago === 'pagado').length

  if (loading) return <LoadingSpinner fullscreen />
  if (!evento) return <p className="p-6 text-sm text-red-500">Evento no encontrado.</p>

  return (
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-6">
      <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
        ← Eventos
      </button>

      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">{evento.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{formatFecha(evento.fecha)}</p>
        {evento.descripcion && <p className="text-sm text-gray-400 mt-1">{evento.descripcion}</p>}
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pedidos</p>
          <p className="text-2xl font-semibold text-gray-900">{pedidos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Entregados</p>
          <p className="text-2xl font-semibold text-gray-900">{entregados}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Monto total</p>
          <p className="text-lg font-semibold text-gray-900">{formatMonto(totalMonto)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Cobrado</p>
          <p className="text-lg font-semibold text-green-600">{formatMonto(cobrado)}</p>
          <p className="text-xs text-gray-400">{pagados} pagados</p>
        </div>
      </div>

      {/* Pedidos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-800">Pedidos</h2>
        <button onClick={openCreate} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + Nuevo pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No hay pedidos para este evento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidosOrdenados.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.nombreCliente}</p>
                  {p.telefono && <p className="text-xs text-gray-400 mt-0.5">{p.telefono}</p>}
                  {/* 3C: mostrar productos si los hay, fallback a descripcion */}
                  {p.productos.length > 0 ? (
                    <p className="text-sm text-gray-600 mt-1">
                      {p.productos.map(pp => `${pp.producto.nombre} × ${pp.cantidad}`).join(' — ')}
                    </p>
                  ) : p.descripcion ? (
                    <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>
                  ) : null}
                  {p.notas && <p className="text-xs text-gray-400 mt-1 italic">{p.notas}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatMonto(parseFloat(p.precioTotal))}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeEntrega(p.estadoEntrega)}`}>
                    {etiquetaEntrega[p.estadoEntrega]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgePago(p.estadoPago)}`}>
                    {etiquetaPago[p.estadoPago]}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pedido */}
      {modalOpen && (
        <Modal title={editTarget ? 'Editar pedido' : 'Nuevo pedido'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Cliente + teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.nombreCliente}
                  onChange={e => setForm(f => ({ ...f, nombreCliente: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="11 1234-5678"
                />
              </div>
            </div>

            {/* Productos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
              {form.items.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {form.items.map((item, idx) => (
                    <div key={item.productoId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-800 flex-1 truncate">{item.nombre}</span>
                      <input
                        type="number"
                        min="1"
                        className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-gray-900"
                        value={item.cantidad}
                        onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                      />
                      <span className="text-gray-400 text-xs">×</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-gray-900"
                        value={item.precioUnitario}
                        onChange={e => actualizarItem(idx, 'precioUnitario', e.target.value)}
                      />
                      <button type="button" onClick={() => quitarItem(idx)} className="text-red-400 hover:text-red-600 text-sm ml-1">×</button>
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

            {/* Precio total */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Precio total</label>
                {form.precioManual && form.items.length > 0 && (
                  <button type="button" onClick={resetPrecioAuto} className="text-xs text-blue-600 hover:text-blue-800">
                    ↺ Usar suma de productos ({formatMonto(calcularTotal(form.items))})
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.precioTotal}
                onChange={e => handlePrecioManual(e.target.value)}
                placeholder="0"
              />
              {!form.precioManual && form.items.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Calculado automáticamente desde los productos</p>
              )}
            </div>

            {/* Estados */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado entrega</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.estadoEntrega}
                  onChange={e => setForm(f => ({ ...f, estadoEntrega: e.target.value as EstadoEntrega }))}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado pago</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.estadoPago}
                  onChange={e => setForm(f => ({ ...f, estadoPago: e.target.value as EstadoPago }))}
                >
                  <option value="sin_seña">Sin seña</option>
                  <option value="señado">Señado</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                rows={2}
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Sin gluten, entrega a domicilio, etc."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-900">Cancelar</button>
              <button
                type="submit"
                disabled={saving}
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <><LoadingSpinner inline /> <span className="ml-1.5">Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear pedido'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
