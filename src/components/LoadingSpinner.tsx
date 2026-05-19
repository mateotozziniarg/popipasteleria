interface Props {
  fullscreen?: boolean
  inline?: boolean
}

export default function LoadingSpinner({ fullscreen = false, inline = false }: Props) {
  if (inline) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 48 48"
        className="animate-spin inline-block"
        style={{ animationDuration: '0.9s' }}
      >
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="5" strokeOpacity="0.25" />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="85 28"
        />
      </svg>
    )
  }

  const wrapper = fullscreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50'
    : 'flex flex-col items-center justify-center py-12'

  return (
    <div className={wrapper}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 48 48"
        className="animate-spin"
        style={{ animationDuration: '1s' }}
      >
        <circle cx="24" cy="24" r="18" fill="none" stroke="#E5EAF1" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="#9CC6EA"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="85 28"
        />
      </svg>
      <p className="mt-3 text-xs text-[#6B7280] tracking-wide">Cargando...</p>
    </div>
  )
}
