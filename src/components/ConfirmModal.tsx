import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  titulo: string
  descripcion?: string
  labelConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
  loading?: boolean
  variant?: 'danger' | 'confirm'
}

export default function ConfirmModal({
  isOpen, titulo, descripcion, labelConfirmar = 'Confirmar', onConfirmar, onCancelar, loading = false, variant = 'danger'
}: Props) {
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && !loading) { e.preventDefault(); onConfirmar() }
      if (e.key === 'Escape') { e.preventDefault(); onCancelar() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, loading, onConfirmar, onCancelar])

  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={loading ? undefined : onCancelar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E2D9CC] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-rose-50' : 'bg-[#F1E4CC]'}`}>
            {isDanger
              ? <AlertTriangle size={17} className="text-rose-500" strokeWidth={2} />
              : <CheckCircle2 size={17} className="text-[#2A1F1A]" strokeWidth={2} />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2A1F1A]">{titulo}</p>
            {descripcion && <p className="text-sm text-[#7A6A5A] mt-1">{descripcion}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="text-sm text-[#7A6A5A] hover:text-[#2A1F1A] transition-colors px-4 py-2 rounded-xl hover:bg-[#FBF6EC] disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={loading}
            className={`text-sm font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-colors ${
              isDanger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#2A1F1A] hover:bg-[#1A1310]'
            }`}
          >
            {loading ? '...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
