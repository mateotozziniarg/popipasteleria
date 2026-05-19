interface Props {
  fullscreen?: boolean
  inline?: boolean
}

export default function LoadingSpinner({ fullscreen = false, inline = false }: Props) {
  if (inline) {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 48 48"
        className="animate-spin inline-block"
        style={{ animationDuration: '1s' }}
      >
        <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="5" strokeOpacity="0.3" />
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
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/70 z-50'
    : 'flex flex-col items-center justify-center py-12'

  return (
    <div className={wrapper}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="animate-spin"
        style={{ animationDuration: '1.1s' }}
      >
        {/* Track */}
        <circle cx="24" cy="24" r="18" fill="none" stroke="#E8E8E4" strokeWidth="3.5" />
        {/* Arc — evoca glaseado derramándose */}
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="#0F0F0F"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="85 28"
        />
        {/* Gota al extremo del arco */}
        <circle cx="24" cy="6" r="2.5" fill="#0F0F0F" />
      </svg>
      <p className="mt-3 text-xs text-gray-400 tracking-wide">Cargando...</p>
    </div>
  )
}
