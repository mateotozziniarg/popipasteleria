import { useNavigate } from 'react-router-dom'

function TortaCaidaIllustration() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      {/* Mancha en el piso */}
      <ellipse cx="85" cy="138" rx="55" ry="10" fill="#E2D9CC" />
      {/* Torta caída — piso inferior tumbado */}
      <rect x="30" y="108" width="90" height="32" rx="12" fill="#F1E4CC" transform="rotate(-12 30 108)" />
      {/* Frosting cayendo */}
      <path d="M28 112 Q40 96 52 108 Q64 94 76 106 Q88 92 100 104" stroke="#B5A28A" strokeWidth="3.5" strokeLinecap="round" fill="none" transform="rotate(-12 28 112)" />
      {/* Piso superior caído */}
      <rect x="50" y="74" width="58" height="28" rx="9" fill="#B5A28A" transform="rotate(8 50 74)" />
      {/* Frosting superior */}
      <path d="M48 76 Q58 64 68 76 Q76 64 86 76 Q94 66 102 76" stroke="#F1E4CC" strokeWidth="2.5" strokeLinecap="round" fill="none" transform="rotate(8 48 76)" />
      {/* Vela volando */}
      <rect x="118" y="40" width="7" height="18" rx="3.5" fill="#FBF6EC" stroke="#E2D9CC" strokeWidth="1.5" transform="rotate(25 118 40)" />
      {/* Llama vela */}
      <ellipse cx="124" cy="36" rx="4" ry="5" fill="#FCD34D" opacity="0.9" transform="rotate(25 124 36)" />
      <ellipse cx="124" cy="35" rx="2" ry="2.5" fill="#FEF3C7" transform="rotate(25 124 35)" />
      {/* Estrellitas de impacto */}
      <path d="M22 88 L26 80 L30 88 L38 84 L30 92 Z" fill="#F1E4CC" stroke="#B5A28A" strokeWidth="1.5" />
      <path d="M130 100 L133 94 L136 100 L142 97 L136 104 Z" fill="#F1E4CC" stroke="#B5A28A" strokeWidth="1.5" />
      <circle cx="18" cy="110" r="5" fill="#B5A28A" opacity="0.25" />
      <circle cx="148" cy="78" r="4" fill="#B5A28A" opacity="0.25" />
      <circle cx="136" cy="120" r="3" fill="#B5A28A" opacity="0.2" />
      {/* Chispas / puntos volando */}
      <circle cx="42" cy="62" r="3" fill="#F1E4CC" stroke="#B5A28A" strokeWidth="1.5" />
      <circle cx="120" cy="58" r="2.5" fill="#F1E4CC" stroke="#B5A28A" strokeWidth="1.5" />
      <circle cx="30" cy="75" r="2" fill="#B5A28A" opacity="0.4" />
      {/* 404 pequeño estilizado arriba */}
      <text x="52" y="52" fontFamily="monospace" fontSize="22" fontWeight="bold" fill="#E2D9CC" letterSpacing="2">404</text>
      <text x="53" y="51" fontFamily="monospace" fontSize="22" fontWeight="bold" fill="#B5A28A" letterSpacing="2" opacity="0.6">404</text>
    </svg>
  )
}

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FBF6EC' }}>
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="mb-6">
          <TortaCaidaIllustration />
        </div>
        <h1 className="text-2xl font-bold text-[#2A1F1A] mb-2">Receta no encontrada</h1>
        <p className="text-sm text-[#7A6A5A] mb-1">Esta página no existe en nuestro recetario.</p>
        <p className="text-sm text-[#B5A28A] mb-8">Pero nuestros pasteles sí. 🍰</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#2A1F1A] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1A1310] transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
