import { useEffect, useRef, useState } from 'react'
import { X, PackageCheck, CheckCircle2, Banknote, Pencil, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarioPedido } from '../api/calendario'
import { Tarea, updateTarea, deleteTarea } from '../api/tareas'
import { updatePedido } from '../api/pedidos'
import { RenderTextoConMenciones } from './TextoConMenciones'
import ConfirmModal from './ConfirmModal'

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const badgePago = (e: string) =>
  e === 'pagado' ? 'bg-emerald-100 text-emerald-700'
  : e === 'señado' ? 'bg-[#F1E4CC] text-[#2A1F1A]'
  : 'bg-rose-100 text-rose-600'

const labelPago = (e: string) =>
  e === 'pagado' ? 'Pagado' : e === 'señado' ? 'Señado' : 'Sin señar'

// ── Popover de pedido ───────────────────────────────────────────────

interface PedidoPopoverProps {
  pedido: CalendarioPedido
  onClose: () => void
  onUpdated: () => void
}

function PedidoPopover({ pedido, onClose, onUpdated }: PedidoPopoverProps) {
  const [loading, setLoading] = useState(false)

  async function marcarEntregado() {
    setLoading(true)
    try {
      await updatePedido(pedido.id, { estadoEntrega: 'entregado' })
      toast.success('Pedido entregado')
      onUpdated()
    } catch { toast.error('Error al actualizar') }
    finally { setLoading(false) }
  }

  async function marcarPagado() {
    setLoading(true)
    try {
      await updatePedido(pedido.id, { estadoPago: 'pagado', montoSeña: null })
      toast.success('Pedido pagado')
      onUpdated()
    } catch { toast.error('Error al actualizar') }
    finally { setLoading(false) }
  }

  const tel = pedido.telefono
  const pendienteEntrega = pedido.estadoEntrega === 'pendiente'
  const pendientePago = pedido.estadoPago !== 'pagado'

  return (
    <div className="flex flex-col gap-3">
      {/* Header info */}
      <div className="flex items-start gap-2 justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#2A1F1A] text-sm">{pedido.nombreCliente}</p>
          {pedido.eventoNombre && <p className="text-xs text-[#B5A28A]">{pedido.eventoNombre}</p>}
          {tel && (
            <a href={`tel:${tel}`} className="text-xs text-[#7A6A5A] hover:text-[#2A1F1A] transition-colors">{tel}</a>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap shrink-0">
          {pedido.modalidadEntrega && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pedido.modalidadEntrega === 'ENVIO' ? 'bg-[#F1E4CC] text-[#2A1F1A]' : 'bg-[#F6EFE1] text-[#7A6A5A]'}`}>
              {pedido.modalidadEntrega === 'ENVIO' ? 'Envío' : 'Retira'}
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pedido.estadoEntrega === 'entregado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {pedido.estadoEntrega === 'entregado' ? 'Entregado' : 'Sin entregar'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgePago(pedido.estadoPago)}`}>
            {labelPago(pedido.estadoPago)}
          </span>
        </div>
      </div>

      {/* Productos */}
      {pedido.productos.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {pedido.productos.map((pp, i) => (
            <li key={i} className="text-xs text-[#7A6A5A] flex items-baseline gap-1.5">
              <span className="font-semibold text-[#2A1F1A] shrink-0">{pp.cantidad}×</span>
              <span>{pp.nombre}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Precio */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-[#2A1F1A]">{fmt(parseFloat(pedido.precioTotal))}</p>
        {pedido.montoSeña && pedido.estadoPago === 'señado' && (
          <p className="text-xs text-[#7A6A5A]">Seña: {fmt(parseFloat(pedido.montoSeña))}</p>
        )}
      </div>

      {/* Acciones rápidas */}
      {(pendienteEntrega || pendientePago) && (
        <div className="flex gap-2 flex-wrap pt-1 border-t border-[#E2D9CC]">
          {pendienteEntrega && (
            <button disabled={loading} onClick={marcarEntregado}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 disabled:opacity-40 transition-colors">
              <PackageCheck size={13} strokeWidth={2} /> Entregar
            </button>
          )}
          {pendientePago && (
            <button disabled={loading} onClick={marcarPagado}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 disabled:opacity-40 transition-colors">
              <CheckCircle2 size={13} strokeWidth={2} /> Pagado
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Popover de tarea ────────────────────────────────────────────────

interface TareaPopoverProps {
  tarea: Tarea
  onClose: () => void
  onUpdated: () => void
  onEdit: (tarea: Tarea) => void
}

function TareaPopover({ tarea, onClose, onUpdated, onEdit }: TareaPopoverProps) {
  const [completada, setCompletada] = useState(tarea.completada)
  const [toggling, setToggling] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function toggleCompletada() {
    setToggling(true)
    try {
      await updateTarea(tarea.id, { completada: !completada })
      setCompletada(c => !c)
      onUpdated()
    } catch { toast.error('Error al actualizar') }
    finally { setToggling(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTarea(tarea.id)
      toast.success('Tarea eliminada')
      onClose()
      onUpdated()
    } catch { toast.error('Error al eliminar') }
    finally { setDeleting(false) }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <button type="button" onClick={toggleCompletada} disabled={toggling}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${completada ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#E2D9CC] hover:border-[#B5A28A]'}`}>
          {completada && <Check size={11} strokeWidth={3} />}
        </button>
        <p className={`text-sm leading-relaxed ${completada ? 'line-through text-[#7A6A5A]' : 'text-[#2A1F1A]'}`}>
          <RenderTextoConMenciones tarea={tarea} />
        </p>
      </div>

      <p className="text-xs text-[#B5A28A]">
        {new Date(tarea.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div className="flex gap-2 pt-1 border-t border-[#E2D9CC]">
        <button onClick={() => onEdit(tarea)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-[#FBF6EC] text-[#2A1F1A] border border-[#E2D9CC] rounded-xl hover:bg-[#E2D9CC] transition-colors">
          <Pencil size={12} strokeWidth={2} /> Editar
        </button>
        <button onClick={() => setConfirmDelete(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
          <Trash2 size={12} strokeWidth={2} /> Eliminar
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        variant="danger"
        titulo="¿Eliminar tarea?"
        descripcion="Esta acción no se puede deshacer."
        labelConfirmar="Eliminar"
        onConfirmar={handleDelete}
        onCancelar={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </div>
  )
}

// ── Popover container ───────────────────────────────────────────────

interface PopoverData {
  tipo: 'pedido' | 'tarea'
  pedido?: CalendarioPedido
  tarea?: Tarea
  rect: DOMRect
}

interface CalendarioItemPopoverProps {
  data: PopoverData | null
  onClose: () => void
  onUpdated: () => void
  onEditTarea: (tarea: Tarea) => void
}

export default function CalendarioItemPopover({ data, onClose, onUpdated, onEditTarea }: CalendarioItemPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [data, onClose])

  if (!data) return null

  // Position near the clicked element
  const vw = window.innerWidth
  const vh = window.innerHeight
  const popoverW = 280
  const popoverH = 320

  let left = data.rect.left
  let top = data.rect.bottom + 8

  if (left + popoverW > vw - 8) left = vw - popoverW - 8
  if (left < 8) left = 8
  if (top + popoverH > vh - 8) top = data.rect.top - popoverH - 8
  if (top < 8) top = 8

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left, width: popoverW, zIndex: 200 }}
      className="bg-white border border-[#E2D9CC] rounded-2xl shadow-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#7A6A5A] uppercase tracking-wider">
          {data.tipo === 'pedido' ? 'Pedido' : 'Tarea'}
        </p>
        <button onClick={onClose} className="text-[#7A6A5A] hover:text-[#2A1F1A] transition-colors">
          <X size={15} strokeWidth={2} />
        </button>
      </div>

      {data.tipo === 'pedido' && data.pedido && (
        <PedidoPopover pedido={data.pedido} onClose={onClose} onUpdated={onUpdated} />
      )}
      {data.tipo === 'tarea' && data.tarea && (
        <TareaPopover tarea={data.tarea} onClose={onClose} onUpdated={onUpdated} onEdit={onEditTarea} />
      )}
    </div>
  )
}

export type { PopoverData }
