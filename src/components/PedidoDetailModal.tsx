import { useEffect, useRef, useState } from 'react'
import { X, Edit2, Share2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { PedidoConEvento } from '../api/pedidos'

interface Props {
  pedido: PedidoConEvento | null
  onClose: () => void
  onEdit: () => void
}

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

export default function PedidoDetailModal({ pedido, onClose, onEdit }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (!pedido) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [pedido, onClose])

  if (!pedido) return null

  function fallbackDownload(blob: Blob, fileName: string) {
    const link = document.createElement('a')
    link.download = fileName
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const fileName = `pedido-${pedido!.nombreCliente.replace(/\s+/g, '-').toLowerCase()}.png`
      const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
      const file = new File([blob], fileName, { type: 'image/png' })

      const canShare = navigator.canShare?.({ files: [file] })
      if (canShare) {
        try {
          await navigator.share({ files: [file], title: `Pedido de ${pedido!.nombreCliente}` })
        } catch (err) {
          // AbortError = usuario canceló el share → no hacer nada
          if (err instanceof DOMException && err.name === 'AbortError') return
          // Cualquier otro error → fallback descarga
          fallbackDownload(blob, fileName)
        }
      } else {
        fallbackDownload(blob, fileName)
      }
    } finally {
      setSharing(false)
    }
  }

  const total = parseFloat(pedido.precioTotal)
  const seña = pedido.montoSeña ? parseFloat(pedido.montoSeña) : null
  const saldo = seña !== null ? total - seña : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-[#E5EAF1] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-5 py-4 border-b-2 border-[#9CC6EA]">
          <h2 className="text-base font-semibold text-[#1F2937]">Detalle del pedido</h2>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1F2937] transition-colors">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Card que se exporta */}
          <div ref={cardRef} className="bg-white rounded-xl border border-[#E5EAF1] p-5">
            {/* Encabezado */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#E5EAF1]">
              <div>
                <p className="text-xs font-bold text-[#9CC6EA] uppercase tracking-widest mb-1">Popipastelería</p>
                <p className="text-xl font-bold text-[#1F2937]">{pedido.nombreCliente}</p>
                {pedido.telefono && <p className="text-sm text-[#6B7280] mt-0.5">{pedido.telefono}</p>}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs text-[#6B7280]">{fmtFecha(pedido.createdAt)}</p>
              </div>
            </div>

            {/* Descripción */}
            {pedido.descripcion && (
              <p className="text-sm text-[#6B7280] mb-4 italic">"{pedido.descripcion}"</p>
            )}

            {/* Productos */}
            {pedido.productos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2.5">Productos</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {pedido.productos.map(item => (
                      <tr key={item.id}>
                        <td style={{ width: '36px', paddingBottom: '6px', paddingRight: '8px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '11px', background: '#F7FAFC', border: '1px solid #E5EAF1', color: '#6B7280', padding: '2px 5px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {item.cantidad}×
                          </span>
                        </td>
                        <td style={{ paddingBottom: '6px', paddingRight: '8px', verticalAlign: 'middle', fontSize: '14px', color: '#1F2937' }}>
                          {item.producto.nombre}
                        </td>
                        <td style={{ paddingBottom: '6px', verticalAlign: 'middle', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#1F2937', whiteSpace: 'nowrap' }}>
                          {fmt(parseFloat(item.precioUnitario) * item.cantidad)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totales */}
            <div className="border-t border-[#E5EAF1] pt-3 flex flex-col gap-1.5">
              {seña !== null && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Seña abonada</span>
                    <span className="font-medium" style={{ color: '#059669' }}>{fmt(seña)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Saldo restante</span>
                    <span className="font-medium" style={{ color: '#d97706' }}>{fmt(saldo!)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-[#E5EAF1]">
                <span className="text-sm font-semibold text-[#1F2937]">Total</span>
                <span className="text-2xl font-bold text-[#1F2937]">{fmt(total)}</span>
              </div>
            </div>

            {/* Notas */}
            {pedido.notas && (
              <div className="mt-4 bg-[#F7FAFC] rounded-lg p-3">
                <p className="text-xs font-medium text-[#6B7280] mb-1">Notas</p>
                <p className="text-sm text-[#1F2937]">{pedido.notas}</p>
              </div>
            )}

            {/* Branding footer */}
            <div className="mt-5 pt-3 border-t border-[#E5EAF1] text-center">
              <p className="text-xs text-[#9CC6EA] font-medium">Popipastelería · Con amor 🍰</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-5 py-4 border-t border-[#E5EAF1] flex items-center justify-between">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#1F2937] transition-colors"
          >
            <Edit2 size={14} strokeWidth={2} />
            Editar pedido
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-1.5 text-sm font-semibold bg-[#1F2937] text-white px-4 py-2.5 rounded-xl hover:bg-[#374151] disabled:opacity-40 transition-colors"
          >
            <Share2 size={14} strokeWidth={2} />
            {sharing ? 'Generando...' : 'Compartir'}
          </button>
        </div>
      </div>
    </div>
  )
}
