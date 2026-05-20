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
  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#E5EAF1] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-rose-50' : 'bg-[#CFE6F7]'}`}>
            {isDanger
              ? <AlertTriangle size={17} className="text-rose-500" strokeWidth={2} />
              : <CheckCircle2 size={17} className="text-[#1F2937]" strokeWidth={2} />
            }
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
            className={`text-sm font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-colors ${
              isDanger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#1F2937] hover:bg-[#374151]'
            }`}
          >
            {loading ? '...' : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
