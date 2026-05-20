import { AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  titulo: string
  descripcion?: string
  labelConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
  loading?: boolean
}

export default function ConfirmModal({
  isOpen, titulo, descripcion, labelConfirmar = 'Borrar', onConfirmar, onCancelar, loading = false
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E5EAF1] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={17} className="text-rose-500" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2937]">{titulo}</p>
            {descripcion && <p className="text-sm text-[#6B7280] mt-1">{descripcion}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={loading}
            className="text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors px-4 py-2 rounded-xl hover:bg-[#F7FAFC] disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={loading}
            className="text-sm font-semibold bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Borrando...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
