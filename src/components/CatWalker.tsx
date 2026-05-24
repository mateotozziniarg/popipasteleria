// Pixel art walking cats — reusable sprite with swappable palettes

// ── Pixel data (shared shape) ──────────────────────────────────────
// Codes: O=body, D=outline/stripe, W=cream muzzle, K=eye, P=pink ear/nose, .=transparent
type Px = 'O'|'D'|'W'|'K'|'P'|'.'

// 16 cols × 14 rows total (11 static + 3 leg rows)
const STATIC_DATA: Px[][] = [
//   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  ['.', '.', 'D', '.', '.', '.', '.', '.', '.', '.', 'D', '.', 'D', '.', '.', '.'], // R0  tail-tip, ear-tips
  ['.', 'D', 'O', 'D', '.', '.', '.', '.', '.', '.', 'D', 'O', 'D', 'O', 'D', '.'], // R1  tail, ears
  ['D', 'O', 'D', '.', '.', '.', '.', '.', '.', 'D', 'O', 'P', 'D', 'P', 'O', 'D'], // R2  tail, inner-ears
  ['D', 'O', 'D', '.', '.', '.', '.', '.', 'D', 'O', 'K', 'K', 'O', 'K', 'K', 'D'], // R3  tail, head+eyes(top)
  ['.', 'D', 'D', 'D', '.', '.', '.', 'D', 'O', 'O', 'K', 'K', 'O', 'K', 'K', 'D'], // R4  tail-base, eyes(bot)
  ['.', '.', '.', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'W', 'W', 'W', 'O', 'O', 'D'], // R5  body+neck, muzzle
  ['.', '.', '.', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'W', 'P', 'W', 'O', 'D', '.'], // R6  body, nose
  ['.', '.', '.', 'D', 'O', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'D', '.', '.', '.'], // R7  body stripe
  ['.', '.', '.', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'D', '.', '.', '.', '.'], // R8  body
  ['.', '.', '.', '.', 'D', 'O', 'D', 'O', 'O', 'O', 'O', 'D', '.', '.', '.', '.'], // R9  belly stripe
  ['.', '.', '.', '.', '.', 'D', 'D', 'D', 'D', 'D', 'D', '.', '.', '.', '.', '.'], // R10 belly-bottom
]

const LEGS_A_DATA: Px[][] = [
  ['.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.', '.'], // R11
  ['.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.', '.'], // R12
  ['.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.', '.'], // R13
]

const LEGS_B_DATA: Px[][] = [
  ['.', '.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.'], // R11
  ['.', '.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.'], // R12
  ['.', '.', '.', '.', '.', '.', 'D', 'D', '.', '.', 'D', 'D', '.', '.', '.', '.'], // R13
]

// ── Palettes ───────────────────────────────────────────────────────
interface Palette { O: string; D: string; W: string; K: string; P: string }

const ORANGE: Palette = { O: '#FF8C00', D: '#7A3000', W: '#FFE8C0', K: '#1A0800', P: '#FF8888' }
const GREY:   Palette = { O: '#AAAAAA', D: '#555555', W: '#FFFFFF', K: '#111111', P: '#FFB0C0' }

function resolve(code: Px, pal: Palette): string | null {
  if (code === '.') return null
  return pal[code]
}

// ── Sprite renderer ────────────────────────────────────────────────
const SCALE = 4
const W_PX  = 16 * SCALE  // 64px
const H_PX  = 14 * SCALE  // 56px

function PixelGrid({ data, offsetY = 0, pal }: { data: Px[][]; offsetY?: number; pal: Palette }) {
  return (
    <>
      {data.map((row, ri) =>
        row.map((code, ci) => {
          const color = resolve(code, pal)
          return color ? (
            <rect key={`${ri}-${ci}`} x={ci} y={offsetY + ri} width={1} height={1} fill={color} />
          ) : null
        })
      )}
    </>
  )
}

function CatSprite({ pal }: { pal: Palette }) {
  return (
    <svg
      viewBox="0 0 16 14"
      width={W_PX}
      height={H_PX}
      style={{ imageRendering: 'pixelated', display: 'block' } as React.CSSProperties}
    >
      <PixelGrid data={STATIC_DATA} pal={pal} />
      <g className="catw-frm-a"><PixelGrid data={LEGS_A_DATA} offsetY={11} pal={pal} /></g>
      <g className="catw-frm-b"><PixelGrid data={LEGS_B_DATA} offsetY={11} pal={pal} /></g>
    </svg>
  )
}

// ── CSS ────────────────────────────────────────────────────────────
const CAT_CSS = `
@keyframes pixelBob {
  0%,49%   { transform: translateY(0); }
  50%,100% { transform: translateY(-${SCALE}px); }
}
@keyframes catFrmA {
  0%,49%   { opacity: 1; }
  50%,100% { opacity: 0; }
}
@keyframes catFrmB {
  0%,49%   { opacity: 0; }
  50%,100% { opacity: 1; }
}
.catw-bob   { animation: pixelBob 0.32s steps(1,end) infinite; }
.catw-frm-a { animation: catFrmA  0.32s steps(1,end) infinite; }
.catw-frm-b { animation: catFrmB  0.32s steps(1,end) infinite; }
.catw-paused .catw-bob,
.catw-paused .catw-frm-a,
.catw-paused .catw-frm-b {
  animation-play-state: paused;
}
`

// ── Individual cat with JS-controlled position ─────────────────────
import { useEffect, useRef } from 'react'

interface CatProps {
  pal: Palette
  speed: number      // px/s
  startDelay: number // ms before first appearance
}

function Cat({ pal, speed, startDelay }: CatProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

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
          if (Math.random() < 0.55) {
            pauseMs = 900 + Math.random() * 1300
          }
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
    return () => cancelAnimationFrame(rafId)
  }, [speed, startDelay])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', bottom: 0 }}
    >
      <div className="catw-bob">
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
        opacity: 0.92,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
        imageRendering: 'pixelated',
      } as React.CSSProperties}>
        <Cat pal={ORANGE} speed={38} startDelay={300} />
        <Cat pal={GREY}   speed={30} startDelay={5500} />
      </div>
    </>
  )
}
