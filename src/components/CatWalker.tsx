const CAT_CSS = `
@keyframes catWalk {
  from { transform: translateX(-90px); }
  to   { transform: translateX(calc(100vw + 90px)); }
}
@keyframes bodyBob {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-2px); }
}
@keyframes stepA {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
@keyframes stepB {
  0%, 100% { transform: translateY(-5px); }
  50%       { transform: translateY(0px); }
}
@keyframes tailWag {
  0%, 100% { transform: rotate(0deg); }
  50%       { transform: rotate(28deg); }
}
.catw-walk { animation: catWalk 18s linear infinite; position: absolute; bottom: 0; }
.catw-bob  { animation: bodyBob 0.38s ease-in-out infinite; }
.catw-a    { animation: stepA 0.38s ease-in-out infinite; }
.catw-b    { animation: stepB 0.38s ease-in-out infinite; }
.catw-tail { animation: tailWag 0.76s ease-in-out infinite; transform-origin: 14px 34px; }
`

function OrangeCat() {
  return (
    <svg viewBox="0 0 76 60" width="76" height="60" style={{ overflow: 'visible' }}>
      {/* Tail (back-left, wags) */}
      <g className="catw-tail">
        <path d="M14,34 C6,26 2,16 8,8" stroke="#D4621A" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </g>

      {/* Body */}
      <ellipse cx="36" cy="38" rx="24" ry="13" fill="#FF8C42"/>
      {/* Belly */}
      <ellipse cx="38" cy="40" rx="14" ry="8" fill="#FFB87A" opacity="0.45"/>
      {/* Tabby stripes */}
      <path d="M22,28 C24,25 27,28" stroke="#C96020" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M30,26 C32,23 35,26" stroke="#C96020" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Head */}
      <circle cx="58" cy="24" r="14" fill="#FF8C42"/>
      {/* Back ear */}
      <polygon points="49,14 52,3 60,13" fill="#E07030"/>
      <polygon points="51,13 53,6 59,13" fill="#FFAAA0" opacity="0.7"/>
      {/* Front ear */}
      <polygon points="59,13 65,3 69,13" fill="#FF8C42"/>
      <polygon points="61,13 65,6 68,13" fill="#FFAAA0" opacity="0.85"/>

      {/* Eyes */}
      <ellipse cx="53" cy="23" rx="3" ry="3.2" fill="#1a1a1a"/>
      <ellipse cx="63" cy="22" rx="3" ry="3.2" fill="#1a1a1a"/>
      <circle cx="54.2" cy="21.6" r="1" fill="white"/>
      <circle cx="64.2" cy="20.6" r="1" fill="white"/>

      {/* Nose */}
      <polygon points="56,27 58,27 57,29" fill="#FF6B8A"/>
      {/* Mouth */}
      <path d="M55,29 Q57,32 59,29" stroke="#CC3355" strokeWidth="0.9" fill="none" strokeLinecap="round"/>

      {/* Whiskers front */}
      <line x1="59" y1="26" x2="75" y2="24" stroke="#bbb" strokeWidth="0.8"/>
      <line x1="59" y1="28" x2="75" y2="28.5" stroke="#bbb" strokeWidth="0.8"/>
      <line x1="59" y1="30" x2="73" y2="32" stroke="#bbb" strokeWidth="0.8"/>
      {/* Whiskers back */}
      <line x1="55" y1="26" x2="44" y2="24" stroke="#bbb" strokeWidth="0.7"/>
      <line x1="55" y1="28" x2="44" y2="28" stroke="#bbb" strokeWidth="0.7"/>

      {/* Front-left leg */}
      <g className="catw-a"><rect x="47" y="49" width="7" height="12" rx="3.5" fill="#E06828"/></g>
      {/* Front-right leg */}
      <g className="catw-b"><rect x="56" y="49" width="7" height="12" rx="3.5" fill="#FF8C42"/></g>
      {/* Back-left leg */}
      <g className="catw-b"><rect x="16" y="49" width="7" height="11" rx="3.5" fill="#E06828"/></g>
      {/* Back-right leg */}
      <g className="catw-a"><rect x="25" y="49" width="7" height="11" rx="3.5" fill="#FF9B50"/></g>
    </svg>
  )
}

export default function CatWalker() {
  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        pointerEvents: 'none',
        zIndex: 31,
        overflow: 'visible',
      }}>
        <div className="catw-walk">
          <div className="catw-bob">
            <OrangeCat />
          </div>
        </div>
      </div>
    </>
  )
}
