interface Props {
  variant: 'eventos' | 'pedidos' | 'clientes' | 'productos' | 'materias'
  titulo: string
  descripcion?: string
  accion?: React.ReactNode
}

function TortaIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      {/* Plato */}
      <ellipse cx="55" cy="96" rx="42" ry="7" fill="#E5EAF1" />
      {/* Piso inferior */}
      <rect x="18" y="68" width="74" height="30" rx="10" fill="#CFE6F7" />
      {/* Frosting inferior ondulado */}
      <path d="M18 68 Q27 56 36 68 Q45 56 54 68 Q63 56 72 68 Q81 56 90 68 Q92 62 92 68" stroke="#9CC6EA" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Piso superior */}
      <rect x="32" y="40" width="46" height="28" rx="8" fill="#9CC6EA" />
      {/* Frosting superior ondulado */}
      <path d="M32 40 Q39 30 46 40 Q53 30 60 40 Q67 30 74 40 Q78 35 78 40" stroke="#CFE6F7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Vela 1 */}
      <rect x="46" y="25" width="6" height="15" rx="3" fill="#F7FAFC" stroke="#E5EAF1" strokeWidth="1.5" />
      {/* Vela 2 */}
      <rect x="58" y="27" width="6" height="13" rx="3" fill="#F7FAFC" stroke="#E5EAF1" strokeWidth="1.5" />
      {/* Llama 1 */}
      <ellipse cx="49" cy="23" rx="3" ry="4" fill="#FCD34D" opacity="0.9" />
      <ellipse cx="49" cy="22" rx="1.5" ry="2" fill="#FEF3C7" />
      {/* Llama 2 */}
      <ellipse cx="61" cy="25" rx="3" ry="4" fill="#FCD34D" opacity="0.9" />
      <ellipse cx="61" cy="24" rx="1.5" ry="2" fill="#FEF3C7" />
      {/* Decoraciones puntitos */}
      <circle cx="30" cy="82" r="2.5" fill="#9CC6EA" opacity="0.5" />
      <circle cx="80" cy="78" r="2" fill="#9CC6EA" opacity="0.5" />
      <circle cx="72" cy="86" r="2" fill="#9CC6EA" opacity="0.4" />
    </svg>
  )
}

function BolsaIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      {/* Sombra */}
      <ellipse cx="55" cy="98" rx="32" ry="6" fill="#E5EAF1" />
      {/* Cuerpo bolsa */}
      <rect x="20" y="38" width="70" height="58" rx="12" fill="#CFE6F7" />
      {/* Asa izquierda */}
      <path d="M36 38 Q36 18 48 18 Q60 18 60 38" stroke="#9CC6EA" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Asa derecha */}
      <path d="M50 38 Q50 18 62 18 Q74 18 74 38" stroke="#9CC6EA" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* Línea decorativa */}
      <line x1="20" y1="52" x2="90" y2="52" stroke="#9CC6EA" strokeWidth="1.5" opacity="0.4" />
      {/* Cookie/galleta dentro */}
      <circle cx="55" cy="73" r="16" fill="#E5EAF1" />
      <circle cx="55" cy="73" r="16" stroke="#9CC6EA" strokeWidth="2" />
      {/* Chips de chocolate */}
      <circle cx="50" cy="68" r="2.5" fill="#9CC6EA" />
      <circle cx="60" cy="70" r="2.5" fill="#9CC6EA" />
      <circle cx="53" cy="78" r="2.5" fill="#9CC6EA" />
      <circle cx="63" cy="76" r="2" fill="#9CC6EA" />
      <circle cx="47" cy="76" r="2" fill="#9CC6EA" />
    </svg>
  )
}

function ChefHatIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      {/* Sombra */}
      <ellipse cx="55" cy="100" rx="30" ry="5" fill="#E5EAF1" />
      {/* Base del gorro */}
      <rect x="24" y="72" width="62" height="18" rx="6" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="2" />
      {/* Banda decorativa */}
      <rect x="24" y="76" width="62" height="6" rx="0" fill="#9CC6EA" opacity="0.3" />
      {/* Cuerpo del gorro (globo) */}
      <path d="M30 72 Q28 42 55 36 Q82 42 80 72 Z" fill="#F7FAFC" stroke="#E5EAF1" strokeWidth="2" />
      {/* Puff top del gorro */}
      <ellipse cx="55" cy="40" rx="22" ry="18" fill="#F7FAFC" stroke="#E5EAF1" strokeWidth="2" />
      {/* Detalle interno */}
      <path d="M38 58 Q45 52 55 56 Q65 52 72 58" stroke="#E5EAF1" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cucharita decorativa */}
      <circle cx="78" cy="88" r="6" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="1.5" />
      <line x1="78" y1="94" x2="78" y2="104" stroke="#9CC6EA" strokeWidth="2" strokeLinecap="round" />
      {/* Tenedor decorativo */}
      <line x1="92" y1="82" x2="92" y2="104" stroke="#9CC6EA" strokeWidth="2" strokeLinecap="round" />
      <line x1="89" y1="82" x2="89" y2="88" stroke="#9CC6EA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="92" y1="82" x2="92" y2="88" stroke="#9CC6EA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="95" y1="82" x2="95" y2="88" stroke="#9CC6EA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CupcakeIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      {/* Sombra */}
      <ellipse cx="55" cy="100" rx="28" ry="5" fill="#E5EAF1" />
      {/* Pirotín */}
      <path d="M30 70 L36 100 L74 100 L80 70 Z" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="2" />
      {/* Líneas pirotín */}
      <line x1="43" y1="70" x2="39" y2="100" stroke="#9CC6EA" strokeWidth="1" opacity="0.4" />
      <line x1="55" y1="70" x2="55" y2="100" stroke="#9CC6EA" strokeWidth="1" opacity="0.4" />
      <line x1="67" y1="70" x2="71" y2="100" stroke="#9CC6EA" strokeWidth="1" opacity="0.4" />
      {/* Frosting base */}
      <ellipse cx="55" cy="68" rx="27" ry="10" fill="#9CC6EA" />
      {/* Frosting swirl */}
      <path d="M55 68 Q68 60 65 48 Q62 38 55 36 Q48 38 45 48 Q42 60 55 68" fill="#CFE6F7" />
      <path d="M55 52 Q62 46 60 38 Q58 32 55 30" stroke="#9CC6EA" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cherry on top */}
      <circle cx="55" cy="27" r="6" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="2" />
      <path d="M55 21 Q58 14 64 16" stroke="#9CC6EA" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Sprinkles */}
      <rect x="44" y="62" width="5" height="2" rx="1" fill="#9CC6EA" transform="rotate(-30 44 62)" opacity="0.6" />
      <rect x="63" y="60" width="5" height="2" rx="1" fill="#9CC6EA" transform="rotate(20 63 60)" opacity="0.6" />
      <rect x="50" y="56" width="4" height="2" rx="1" fill="#9CC6EA" transform="rotate(45 50 56)" opacity="0.5" />
    </svg>
  )
}

function BowlIllustration() {
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
      {/* Sombra */}
      <ellipse cx="55" cy="100" rx="35" ry="6" fill="#E5EAF1" />
      {/* Bowl */}
      <path d="M18 55 Q18 92 55 92 Q92 92 92 55 Z" fill="#CFE6F7" />
      <path d="M18 55 Q18 92 55 92 Q92 92 92 55" stroke="#9CC6EA" strokeWidth="2.5" fill="none" />
      {/* Rim del bowl */}
      <ellipse cx="55" cy="55" rx="37" ry="10" fill="#E5EAF1" stroke="#9CC6EA" strokeWidth="2" />
      {/* Contenido - mezcla */}
      <ellipse cx="55" cy="55" rx="28" ry="7" fill="#9CC6EA" opacity="0.3" />
      {/* Batidor/whisk */}
      <line x1="70" y1="20" x2="58" y2="60" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
      {/* Cabeza del batidor */}
      <path d="M58 60 Q62 45 66 50 Q70 40 64 38 Q68 30 72 38 Q76 30 70 28 Q74 20 70 20" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M58 60 Q54 45 58 48 Q56 38 62 36" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Ingredientes flotando */}
      <circle cx="28" cy="36" r="5" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="1.5" />
      <text x="23" y="40" fontSize="8" fill="#9CC6EA">★</text>
      <circle cx="85" cy="42" r="4" fill="#CFE6F7" stroke="#9CC6EA" strokeWidth="1.5" />
      <circle cx="22" cy="65" r="3" fill="#9CC6EA" opacity="0.4" />
      <circle cx="88" cy="68" r="3" fill="#9CC6EA" opacity="0.4" />
    </svg>
  )
}

export default function EmptyState({ variant, titulo, descripcion, accion }: Props) {
  const illustration = {
    eventos: <TortaIllustration />,
    pedidos: <BolsaIllustration />,
    clientes: <ChefHatIllustration />,
    productos: <CupcakeIllustration />,
    materias: <BowlIllustration />,
  }[variant]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 opacity-90">{illustration}</div>
      <p className="text-base font-semibold text-[#1F2937] mb-1">{titulo}</p>
      {descripcion && <p className="text-sm text-[#6B7280] max-w-xs">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
