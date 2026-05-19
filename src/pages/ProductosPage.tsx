import { useEffect, useState } from 'react'
import { Producto, getProductos, createProducto, updateProducto, deleteProducto } from '../api/productos'
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

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Producto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setProductos(await getProductos())
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

  function openEdit(p: Producto) {
    setEditTarget(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', precioDefault: p.precioDefault })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    try {
      await deleteProducto(p.id)
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al eliminar'
      alert(msg)
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
        await updateProducto(editTarget.id, { nombre: form.nombre, descripcion: form.descripcion || undefined, precioDefault: precio })
      } else {
        await createProducto({ nombre: form.nombre, descripcion: form.descripcion || undefined, precioDefault: precio })
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
    <div className="max-w-3xl mx-auto px-4 pt-16 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Productos</h1>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : productos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base">No hay productos todavía.</p>
          <p className="text-sm mt-1">Creá el primero para empezar.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Descripción</th>
                <th className="text-right px-4 py-3">Precio</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                    {formatMonto(parseFloat(p.precioDefault))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Editar</button>
                      <button onClick={() => handleDelete(p)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editTarget ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Torta de chocolate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: 30 porciones, 3 pisos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio por defecto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={form.precioDefault}
                onChange={e => setForm(f => ({ ...f, precioDefault: e.target.value }))}
                placeholder="0"
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
                {saving ? <><LoadingSpinner inline /> <span className="ml-1.5">Guardando...</span></> : editTarget ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
