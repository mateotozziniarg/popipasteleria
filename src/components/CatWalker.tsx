// Pixel art walking cats — detailed tabby sprite with swappable palettes
import { useEffect, useRef, useState } from 'react'

// ── Sprite frames (30×20). Two walk frames differing only in leg stride ──
// Codes: o=body  d=outline/stripe  m=mid-shade  w=cream  k=eye  p=pink  h=whisker  l=eye-shine  .=transparent
const FRAME_A = [
  '..............................',
  '.....................dd...dd..',
  '....................dopd.dpod.',
  '....dd............ddoopodopood',
  '...dm...........ddoooooooooood',
  '...dd....d..ddddoodooooodooood',
  '...dd....ddddoodoklooooklooood',
  '....dd.ddmoomoomokkooookkooood',
  '.....ddooooooooooowwwwwwwwohhh',
  '....doooooooooooowwwwppwwwwood',
  '....dooooooooooooowwwpwwwwoood',
  '....doooooooooooooowwwwwwoohhh',
  '.....dooooooooooooooooooooood.',
  '.....dowwwwwwwwwwwwwwwoooood..',
  '.....dowwwwwwwwwwwwwwoooood...',
  '......dwwwwwwwwwwwwwddoodd....',
  '......dd...dd.....dd..dd......',
  '......dd...dd.....dd..dd......',
  '......dd..............dd......',
  '..............................',
]
const FRAME_B = [
  '..............................',
  '.....................dd...dd..',
  '....................dopd.dpod.',
  '....dd............ddoopodopood',
  '...dm...........ddoooooooooood',
  '...dd....d..ddddoodooooodooood',
  '...dd....ddddoodoklooooklooood',
  '....dd.ddmoomoomokkooookkooood',
  '.....ddooooooooooowwwwwwwwohhh',
  '....doooooooooooowwwwppwwwwood',
  '....dooooooooooooowwwpwwwwoood',
  '....doooooooooooooowwwwwwoohhh',
  '.....dooooooooooooooooooooood.',
  '.....dowwwwwwwwwwwwwwwoooood..',
  '.....dowwwwwwwwwwwwwwoooood...',
  '......dwwwwwwwwwwwwwodoodd....',
  '......dd..dd.......dd.dd......',
  '......dd..dd.......dd.dd......',
  '..........dd.......dd.........',
  '..............................',
]

const COLS = 30
const ROWS = 20

// ── Palettes ───────────────────────────────────────────────────────
type Palette = Record<string, string>

const BLONDE: Palette = { o: '#FFD24D', d: '#8A5A12', m: '#E6A832', w: '#FFF3D0', k: '#201000', p: '#FF9A9A', h: '#F0DCA8', l: '#FFE893' }
const GREY:   Palette = { o: '#ABABAB', d: '#4D4D4D', m: '#878787', w: '#F2F2F2', k: '#111111', p: '#FFB0C0', h: '#DCDCDC', l: '#D2D2D2' }
const TUXEDO: Palette = { o: '#F4F4F4', d: '#1A1A1A', m: '#3A3A3A', w: '#FFFFFF', k: '#000000', p: '#FFAEC0', h: '#CFCFCF', l: '#FFFFFF' }
const SILVER: Palette = { o: '#CFCFCF', d: '#777777', m: '#AEAEAE', w: '#F7F7F7', k: '#222222', p: '#FFC0CC', h: '#E4E4E4', l: '#ECECEC' }

// ── Sprite renderer ────────────────────────────────────────────────
const SCALE = 1.5
const W_PX  = COLS * SCALE  // 45px
const H_PX  = ROWS * SCALE  // 30px

function PixelGrid({ rows, pal }: { rows: string[]; pal: Palette }) {
  return (
    <>
      {rows.map((row, ri) =>
        row.split('').map((code, ci) => {
          const color = pal[code]
          return color ? (
            <rect key={`${ri}-${ci}`} x={ci} y={ri} width={1} height={1} fill={color} />
          ) : null
        })
      )}
    </>
  )
}

function CatSprite({ pal }: { pal: Palette }) {
  return (
    <svg
      viewBox={`0 0 ${COLS} ${ROWS}`}
      width={W_PX}
      height={H_PX}
      style={{ imageRendering: 'pixelated', display: 'block' } as React.CSSProperties}
    >
      <g className="catw-frm-a"><PixelGrid rows={FRAME_A} pal={pal} /></g>
      <g className="catw-frm-b"><PixelGrid rows={FRAME_B} pal={pal} /></g>
    </svg>
  )
}

// ── CSS ────────────────────────────────────────────────────────────
const CAT_CSS = `
@keyframes pixelBob {
  0%,49%   { transform: translateY(0); }
  50%,100% { transform: translateY(-${SCALE * 1.5}px); }
}
@keyframes catFrmA { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes catFrmB { 0%,49% { opacity: 0; } 50%,100% { opacity: 1; } }
@keyframes catJump {
  0%   { transform: translateY(0) scaleX(1) scaleY(1); }
  18%  { transform: translateY(-${SCALE * 6}px) scaleX(0.9) scaleY(1.12); }
  42%  { transform: translateY(-${SCALE * 11}px) scaleX(0.86) scaleY(1.16); }
  68%  { transform: translateY(-${SCALE * 3}px) scaleX(1.12) scaleY(0.88); }
  82%  { transform: translateY(-${SCALE}px) scaleX(1.06) scaleY(0.95); }
  100% { transform: translateY(0) scaleX(1) scaleY(1); }
}
.catw-bob   { animation: pixelBob 0.34s steps(1,end) infinite; transform-origin: 50% 100%; }
.catw-frm-a { animation: catFrmA  0.34s steps(1,end) infinite; }
.catw-frm-b { animation: catFrmB  0.34s steps(1,end) infinite; }
.catw-jumping { animation: catJump 0.6s ease-out forwards !important; transform-origin: 50% 100%; }
.catw-paused .catw-bob,
.catw-paused .catw-frm-a,
.catw-paused .catw-frm-b { animation-play-state: paused; }
`

// ── Individual cat with JS-controlled position ─────────────────────
interface CatProps {
  pal: Palette
  speed: number      // px/s
  startDelay: number // ms before first appearance
}

function Cat({ pal, speed, startDelay }: CatProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [jumping, setJumping] = useState(false)
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const _wrap = wrapRef.current
    if (!_wrap) return
    const wrap: HTMLDivElement = _wrap

    let x = -W_PX
    let pauseMs = startDelay
    let midPauseTimer = 10000 + Math.random() * 8000
    let lastTime: number | null = null
    let rafId: number

    wrap.style.transform = `translateX(${-W_PX}px)`

    function tick(now: number) {
      if (lastTime === null) lastTime = now
      const dt = Math.min(now - lastTime, 100)
      lastTime = now

      if (pauseMs > 0) {
        pauseMs -= dt
        wrap.classList.add('catw-paused')
      } else {
        wrap.classList.remove('catw-paused')
        x += speed * dt / 1000
        midPauseTimer -= dt

        if (x > window.innerWidth + W_PX) {
          x = -W_PX
          if (Math.random() < 0.55) pauseMs = 900 + Math.random() * 1300
          midPauseTimer = 10000 + Math.random() * 8000
        }

        if (midPauseTimer <= 0) {
          pauseMs = 700 + Math.random() * 900
          midPauseTimer = 10000 + Math.random() * 8000
        }

        wrap.style.transform = `translateX(${Math.round(x)}px)`
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      if (jumpTimer.current) clearTimeout(jumpTimer.current)
    }
  }, [speed, startDelay])

  function handleClick() {
    if (jumping) return
    setJumping(true)
    jumpTimer.current = setTimeout(() => setJumping(false), 620)
  }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', bottom: 0, cursor: 'pointer', pointerEvents: 'auto' }}
      onClick={handleClick}
    >
      <div className={jumping ? 'catw-jumping' : 'catw-bob'}>
        <CatSprite pal={pal} />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export default function CatWalker() {
  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed',
        bottom: 8,
        left: 0,
        right: 0,
        height: H_PX,
        pointerEvents: 'none',
        zIndex: 31,
        overflow: 'visible',
        opacity: 0.94,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
        imageRendering: 'pixelated',
      } as React.CSSProperties}>
        <Cat pal={BLONDE} speed={44} startDelay={300}   />
        <Cat pal={GREY}   speed={30} startDelay={5500}  />
        <Cat pal={TUXEDO} speed={56} startDelay={10500} />
        <Cat pal={SILVER} speed={36} startDelay={16000} />
      </div>
    </>
  )
}
