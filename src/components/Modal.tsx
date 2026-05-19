import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E5EAF1]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF1]">
          <h2 className="font-semibold text-[#1F2937] text-base">{title}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F7FAFC] transition-colors"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
