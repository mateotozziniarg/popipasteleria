// Pixel art arcade cat — 18×14 sprite at 5× scale, facing right
// Body elongated oval, round head, 4 clearly distinct legs

const O = '#FF8800'  // orange body
const D = '#7A3000'  // dark outline / stripes
const W = '#FFE8C0'  // eye white
const K = '#1A0800'  // pupil
const P = '#FF8888'  // pink nose / inner ear
const _ = null       // transparent

// ── Static pixels (head, body, tail, ears) — rows 0–9 ────────────────
//    cols: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
const STATIC: (string | null)[][] = [
  [ _, _, _, _, _, _, _, _, _, _, _, D, _, _, D, _, _, _ ], // 0  ear tips
  [ _, _, _, _, _, _, _, _, _, _, D, O, D, D, O, D, _, _ ], // 1  ears
  [ D, _, _, _, _, _, _, _, _, D, O, P, D, D, P, O, D, _ ], // 2  tail-top + inner ears
  [ D, _, _, _, _, _, _, _, D, O, O, O, O, O, O, O, O, D ], // 3  tail + head upper
  [ _, D, _, _, _, _, _, D, O, O, W, K, O, O, W, K, O, D ], // 4  tail + eyes
  [ _, _, D, D, _, _, D, O, O, O, O, O, P, O, O, O, D, _ ], // 5  tail-base + nose + body
  [ _, _, _, D, O, O, O, O, D, O, O, O, O, D, O, O, D, _ ], // 6  body (stripe at 8,13)
  [ _, _, _, D, O, O, D, O, O, O, O, O, O, O, O, O, D, _ ], // 7  body (stripe at 6)
  [ _, _, _, D, O, O, O, O, O, O, D, O, O, O, O, O, D, _ ], // 8  body (stripe at 10)
  [ _, _, _, _, D, D, D, D, D, D, D, D, D, D, D, D, _, _ ], // 9  body bottom
]

// ── Frame A — left-back & right-front legs in stance (lower) ─────────
//    cols: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
const LEGS_A: (string | null)[][] = [
  [ _, _, _, _, D, D, _, D, D, _, _, _, D, D, _, D, D, _ ], // 10 all 4 legs visible
  [ _, _, _, _, D, D, _, D, D, _, _, _, D, D, _, D, D, _ ], // 11 legs
  [ _, _, _, _, D, D, _, _, _, _, _, _, _, _, _, D, D, _ ], // 12 stance legs extend
  [ _, _, _, _, D, D, _, _, _, _, _, _, _, _, _, D, D, _ ], // 13 paw level
]

// ── Frame B — right-back & left-front legs in stance (lower) ─────────
//    cols: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
const LEGS_B: (string | null)[][] = [
  [ _, _, _, _, D, D, _, D, D, _, _, _, D, D, _, D, D, _ ], // 10 all 4 legs visible
  [ _, _, _, _, D, D, _, D, D, _, _, _, D, D, _, D, D, _ ], // 11 legs
  [ _, _, _, _, _, _, _, D, D, _, _, _, D, D, _, _, _, _ ], // 12 stance legs extend
  [ _, _, _, _, _, _, _, D, D, _, _, _, D, D, _, _, _, _ ], // 13 paw level
]

const SCALE = 5  // 5× → 90×70 px display size

function PixelGrid({ rows, offsetY = 0 }: { rows: (string | null)[][]; offsetY?: number }) {
  return (
    <>
      {rows.map((row, ri) =>
        row.map((color, ci) =>
          color ? (
            <rect key={`${ri}-${ci}`} x={ci} y={offsetY + ri} width={1} height={1} fill={color} />
          ) : null
        )
      )}
    </>
  )
}

const CAT_CSS = `
@keyframes catWalk {
  from { transform: translateX(-${18 * SCALE}px); }
  to   { transform: translateX(calc(100vw + ${18 * SCALE}px)); }
}
@keyframes pixelBob {
  0%,49% { transform: translateY(0); }
  50%,100% { transform: translateY(-${SCALE}px); }
}
@keyframes catFrameA {
  0%,49% { opacity: 1; }
  50%,100% { opacity: 0; }
}
@keyframes catFrameB {
  0%,49% { opacity: 0; }
  50%,100% { opacity: 1; }
}
.catw-walk   { animation: catWalk 18s linear infinite; position: absolute; bottom: 0; }
.catw-bob    { animation: pixelBob 0.25s steps(1,end) infinite; }
.catw-frm-a  { animation: catFrameA 0.25s steps(1,end) infinite; }
.catw-frm-b  { animation: catFrameB 0.25s steps(1,end) infinite; }
`

export default function CatWalker() {
  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 14 * SCALE,
        pointerEvents: 'none',
        zIndex: 31,
        overflow: 'visible',
      }}>
        <div className="catw-walk">
          <div className="catw-bob">
            <svg
              viewBox="0 0 18 14"
              width={18 * SCALE}
              height={14 * SCALE}
              style={{ imageRendering: 'pixelated', display: 'block' }}
            >
              <PixelGrid rows={STATIC} />
              <g className="catw-frm-a">
                <PixelGrid rows={LEGS_A} offsetY={10} />
              </g>
              <g className="catw-frm-b">
                <PixelGrid rows={LEGS_B} offsetY={10} />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
