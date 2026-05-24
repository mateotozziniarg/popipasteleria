// Pixel art walking cats — reusable sprite with swappable palettes

// ── Pixel data (shared shape) ──────────────────────────────────────
// Codes: O=body, D=outline, W=eye-white, K=pupil, P=pink, .=transparent
type Px = 'O'|'D'|'W'|'K'|'P'|'.'

const STATIC_DATA: Px[][] = [
//  0    1    2    3    4    5    6    7    8    9   10   11   12   13
  ['.', '.', '.', '.', '.', '.', '.', '.', '.', 'D', '.', 'D', '.', '.'], // R0 ear tips
  ['D', '.', '.', '.', '.', '.', '.', '.', 'D', 'O', 'D', 'O', 'D', '.'], // R1 tail-tip + ears
  ['D', '.', '.', '.', '.', '.', '.', 'D', 'O', 'P', 'D', 'P', 'O', 'D'], // R2 tail + inner ears
  ['.', 'D', '.', '.', '.', '.', 'D', 'O', 'O', 'O', 'D', 'O', 'O', 'D'], // R3 tail + head
  ['.', 'D', '.', '.', '.', 'D', 'O', 'W', 'K', 'O', 'O', 'W', 'K', 'D'], // R4 tail + eyes
  ['.', '.', 'D', 'D', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'P', 'D', '.'], // R5 tail-base + nose
  ['.', '.', '.', 'D', 'O', 'O', 'D', 'O', 'O', 'O', 'D', 'O', 'D', '.'], // R6 body + stripes
  ['.', '.', '.', 'D', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'D', '.'], // R7 body smooth
  ['.', '.', '.', '.', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', '.', '.'], // R8 body bottom
]

const LEGS_A_DATA: Px[][] = [
  ['.', '.', '.', '.', 'D', 'D', '.', '.', '.', 'D', 'D', '.', '.', '.'], // R9
  ['.', '.', '.', '.', 'D', 'D', '.', '.', '.', 'D', 'D', '.', '.', '.'], // R10
  ['.', '.', '.', '.', 'D', 'D', '.', '.', '.', 'D', 'D', '.', '.', '.'], // R11
]

const LEGS_B_DATA: Px[][] = [
  ['.', '.', '.', '.', '.', 'D', 'D', '.', 'D', 'D', '.', '.', '.', '.'], // R9
  ['.', '.', '.', '.', '.', 'D', 'D', '.', 'D', 'D', '.', '.', '.', '.'], // R10
  ['.', '.', '.', '.', '.', 'D', 'D', '.', 'D', 'D', '.', '.', '.', '.'], // R11
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
const W_PX  = 14 * SCALE
const H_PX  = 12 * SCALE

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
    <svg viewBox="0 0 14 12" width={W_PX} height={H_PX}
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <PixelGrid data={STATIC_DATA} pal={pal} />
      <g className="catw-frm-a"><PixelGrid data={LEGS_A_DATA} offsetY={9} pal={pal} /></g>
      <g className="catw-frm-b"><PixelGrid data={LEGS_B_DATA} offsetY={9} pal={pal} /></g>
    </svg>
  )
}

// ── CSS ────────────────────────────────────────────────────────────
const CAT_CSS = `
@keyframes catWalk1 {
  from { transform: translateX(-${W_PX}px); }
  to   { transform: translateX(calc(100vw + ${W_PX}px)); }
}
@keyframes catWalk2 {
  from { transform: translateX(-${W_PX}px); }
  to   { transform: translateX(calc(100vw + ${W_PX}px)); }
}
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
.catw-walk1  { animation: catWalk1 18s linear infinite; position: absolute; bottom: 0; }
.catw-walk2  { animation: catWalk2 22s linear infinite -11s; position: absolute; bottom: 0; }
.catw-bob    { animation: pixelBob 0.25s steps(1,end) infinite; }
.catw-frm-a  { animation: catFrmA  0.25s steps(1,end) infinite; }
.catw-frm-b  { animation: catFrmB  0.25s steps(1,end) infinite; }
`

// ── Main component ─────────────────────────────────────────────────
export default function CatWalker() {
  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: H_PX, pointerEvents: 'none', zIndex: 31, overflow: 'visible',
      }}>
        {/* Orange cat */}
        <div className="catw-walk1">
          <div className="catw-bob"><CatSprite pal={ORANGE} /></div>
        </div>
        {/* Grey cat */}
        <div className="catw-walk2">
          <div className="catw-bob"><CatSprite pal={GREY} /></div>
        </div>
      </div>
    </>
  )
}
