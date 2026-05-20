import { ChefHat } from 'lucide-react'

interface Props {
  fullscreen?: boolean
  inline?: boolean
}

export default function LoadingSpinner({ fullscreen = false, inline = false }: Props) {
  if (inline) {
    return (
      <ChefHat
        size={15}
        strokeWidth={2}
        className="inline-block animate-spin"
        style={{ animationDuration: '0.8s' }}
      />
    )
  }

  const wrapper = fullscreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50'
    : 'flex flex-col items-center justify-center py-12'

  return (
    <div className={wrapper}>
      <ChefHat
        size={48}
        strokeWidth={1.5}
        color="#9CC6EA"
        className="animate-bounce"
        style={{ animationDuration: '0.75s' }}
      />
      <p className="mt-3 text-xs text-[#6B7280] tracking-wide">Cargando...</p>
    </div>
  )
}
