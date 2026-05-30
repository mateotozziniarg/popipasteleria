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
  '...dd....ddddoodoooklooooklood',
  '....dd.ddmoomoomoookkooookkood',
  '.....ddoooooooooooowwwwwwwwhhh',
  '....doooooooooooooowwwwppwwwod',
  '....dooooooooooooooowwwpwwwwod',
  '....doooooooooooooooowwwwwwhhh',
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
  '...dd....ddddoodoooklooooklood',
  '....dd.ddmoomoomoookkooookkood',
  '.....ddoooooooooooowwwwwwwwhhh',
  '....doooooooooooooowwwwppwwwod',
  '....dooooooooooooooowwwpwwwwod',
  '....doooooooooooooooowwwwwwhhh',
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
const TUXEDO: Palette = { o: '#2B2B2B', d: '#0A0A0A', m: '#454545', w: '#FFFFFF', k: '#FFD24D', p: '#FFAEC0', h: '#9A9A9A', l: '#FFE893' }
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
@keyframes catSit {
  0%   { transform: scaleY(0.78) scaleX(1.05); }
  100% { transform: scaleY(0.9) scaleX(1.02); }
}
@keyframes catSleep {
  0%,100% { transform: scaleY(0.56) scaleX(1.14); }
  50%     { transform: scaleY(0.52) scaleX(1.16); }
}
@keyframes catZ {
  0%   { opacity: 0; transform: translate(0,0) scale(0.5) rotate(0deg); }
  20%  { opacity: 0.95; }
  100% { opacity: 0; transform: translate(10px,-18px) scale(1.1) rotate(12deg); }
}
.catw-bob   { animation: pixelBob 0.34s steps(1,end) infinite; transform-origin: 50% 100%; }
.catw-sit   { animation: catSit 0.45s ease-out forwards; transform-origin: 50% 100%; }
.catw-sleep { animation: catSleep 2.6s ease-in-out infinite; transform-origin: 50% 100%; }
.catw-frm-a { animation: catFrmA  0.34s steps(1,end) infinite; }
.catw-frm-b { animation: catFrmB  0.34s steps(1,end) infinite; }
.catw-jumping { animation: catJump 0.6s ease-out forwards !important; transform-origin: 50% 100%; }
.catw-paused .catw-bob,
.catw-paused .catw-frm-a,
.catw-paused .catw-frm-b { animation-play-state: paused; }
.catw-zzz { position: absolute; top: -6px; left: 62%; pointer-events: none; }
.catw-zzz span {
  position: absolute; font-weight: 800; color: #8aa0b4;
  font-family: monospace; opacity: 0;
  animation: catZ 1.9s ease-out infinite;
}
`

// ── Individual cat: roams between screen edges with a small behaviour FSM ─
type State = 'walk' | 'sit' | 'sleep' | 'jump'

interface CatProps {
  pal: Palette
  speed: number   // base px/s
  startFrac: number // initial horizontal position (0..1)
}

function Cat({ pal, speed, startFrac }: CatProps) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const faceRef  = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const ctrlRef  = useRef<{ poke: () => void } | null>(null)
  const [sleeping, setSleeping] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current as HTMLDivElement
    const face = faceRef.current as HTMLDivElement
    const inner = innerRef.current as HTMLDivElement
    if (!wrap || !face || !inner) return

    const maxX = () => Math.max(0, window.innerWidth - W_PX)
    let dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1
    let x = startFrac * maxX()
    let state: State = 'walk'
    let timer = 1500 + Math.random() * 3000
    let curSpeed = speed
    let lastTime: number | null = null
    let rafId: number

    const setFacing = () => { face.style.transform = `scaleX(${dir})` }
    const setPos    = () => { wrap.style.transform = `translateX(${Math.round(x)}px)` }

    function enter(s: State) {
      state = s
      if (s === 'walk') {
        wrap.classList.remove('catw-paused')
        inner.className = 'catw-bob'
        setSleeping(false)
        curSpeed = speed * (0.7 + Math.random() * 0.6)
        timer = 3500 + Math.random() * 5500
      } else if (s === 'sit') {
        wrap.classList.add('catw-paused')
        inner.className = 'catw-sit'
        setSleeping(false)
        timer = 2500 + Math.random() * 3500
      } else if (s === 'sleep') {
        wrap.classList.add('catw-paused')
        inner.className = 'catw-sleep'
        setSleeping(true)
        timer = 6000 + Math.random() * 9000
      } else if (s === 'jump') {
        wrap.classList.remove('catw-paused')
        inner.className = 'catw-jumping'
        setSleeping(false)
        timer = 620
      }
    }

    function decide() {
      const r = Math.random()
      if (r < 0.55) { if (Math.random() < 0.35) { dir = (dir * -1) as 1 | -1; setFacing() } enter('walk') }
      else if (r < 0.8) enter('sit')
      else enter('sleep')
    }

    ctrlRef.current = {
      poke() { if (state !== 'jump') enter('jump') },
    }

    setFacing()
    setPos()
    enter(Math.random() < 0.7 ? 'walk' : (Math.random() < 0.6 ? 'sit' : 'sleep'))

    function tick(now: number) {
      if (lastTime === null) lastTime = now
      const dt = Math.min(now - lastTime, 100)
      lastTime = now
      timer -= dt

      if (state === 'walk') {
        const m = maxX()
        x += curSpeed * dir * dt / 1000
        if (x <= 0) { x = 0; dir = 1; setFacing() }
        else if (x >= m) { x = m; dir = -1; setFacing() }
        setPos()
        if (timer <= 0) decide()
      } else if (timer <= 0) {
        // leaving sit / sleep / jump
        if (state !== 'jump' && Math.random() < 0.3) { dir = (dir * -1) as 1 | -1; setFacing() }
        enter('walk')
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    const onResize = () => { const m = maxX(); if (x > m) { x = m; setPos() } }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize) }
  }, [speed, startFrac])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', bottom: 0, cursor: 'pointer', pointerEvents: 'auto' }}
      onClick={() => ctrlRef.current?.poke()}
    >
      {sleeping && (
        <div className="catw-zzz" aria-hidden>
          <span style={{ fontSize: 8,  animationDelay: '0s'   }}>z</span>
          <span style={{ fontSize: 10, animationDelay: '0.6s', left: 4 }}>z</span>
          <span style={{ fontSize: 12, animationDelay: '1.2s', left: 9 }}>z</span>
        </div>
      )}
      <div ref={faceRef}>
        <div ref={innerRef}>
          <CatSprite pal={pal} />
        </div>
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
        <Cat pal={BLONDE} speed={42} startFrac={0.12} />
        <Cat pal={GREY}   speed={28} startFrac={0.40} />
        <Cat pal={TUXEDO} speed={52} startFrac={0.64} />
        <Cat pal={SILVER} speed={34} startFrac={0.86} />
      </div>
    </>
  )
}
