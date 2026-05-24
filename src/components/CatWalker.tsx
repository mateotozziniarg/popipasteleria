// Pixel art arcade cat — 14×13 sprite at 5× scale
// Facing right, 2-frame walk animation

const O = '#FF8800'  // orange body
const D = '#7A3000'  // dark outline / stripes
const W = '#FFE8C0'  // eye white
const K = '#1A0800'  // pupil
const P = '#FF8888'  // pink nose / inner ear
const _ = null       // transparent

// Static pixels (head, body, tail, ears) — rows 0-9
const STATIC: (string | null)[][] = [
  [ _,  _,  _,  _,  _,  _,  _,  D,  _,  _,  _,  D,  _,  _ ], // 0 ear tips
  [ _,  _,  _,  _,  _,  _,  D,  O,  D,  _,  D,  O,  D,  _ ], // 1 ears
  [ D,  _,  _,  _,  _,  D,  O,  P,  D,  _,  D,  P,  O,  D ], // 2 inner ears + tail top
  [ D,  _,  _,  _,  D,  O,  O,  O,  O,  D,  O,  O,  O,  D ], // 3 head (nose bridge D at col9)
  [ _,  D,  _,  _,  O,  O,  W,  K,  O,  O,  W,  K,  O,  D ], // 4 eyes + tail mid
  [ _,  _,  D,  O,  O,  O,  O,  O,  O,  P,  O,  O,  D,  _ ], // 5 nose + body start + tail base
  [ _,  _,  D,  O,  O,  D,  O,  O,  O,  D,  O,  O,  D,  _ ], // 6 body stripes
  [ _,  _,  D,  O,  D,  O,  O,  O,  D,  O,  O,  O,  D,  _ ], // 7 body stripes
  [ _,  _,  D,  O,  O,  O,  O,  O,  O,  O,  O,  O,  D,  _ ], // 8 body
  [ _,  _,  D,  D,  D,  D,  D,  D,  D,  D,  D,  D,  D,  _ ], // 9 body bottom
]

// Frame A legs (front-right + back-left forward)
const LEGS_A: (string | null)[][] = [
  [ _,  _,  _,  D,  _,  D,  _,  _,  D,  _,  D,  _,  _,  _ ], // 10
  [ _,  _,  _,  D,  _,  D,  _,  _,  D,  _,  D,  _,  _,  _ ], // 11
  [ _,  _,  _,  D,  D,  _,  _,  _,  D,  D,  _,  _,  _,  _ ], // 12 paws
]

// Frame B legs (front-left + back-right forward)
const LEGS_B: (string | null)[][] = [
  [ _,  _,  _,  _,  D,  _,  D,  _,  _,  D,  _,  D,  _,  _ ], // 10
  [ _,  _,  _,  _,  D,  _,  D,  _,  _,  D,  _,  D,  _,  _ ], // 11
  [ _,  _,  _,  _,  D,  D,  _,  _,  _,  D,  D,  _,  _,  _ ], // 12 paws
]

const SCALE = 5

function PixelGrid({ rows, offsetY = 0 }: { rows: (string | null)[][]; offsetY?: number }) {
  return (
    <>
      {rows.map((row, ri) =>
        row.map((color, ci) =>
          color ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci}
              y={offsetY + ri}
              width={1}
              height={1}
              fill={color}
            />
          ) : null
        )
      )}
    </>
  )
}

const CAT_CSS = `
@keyframes catWalk {
  from { transform: translateX(-80px); }
  to   { transform: translateX(calc(100vw + 80px)); }
}
@keyframes pixelBob {
  0%, 49% { transform: translateY(0px); }
  50%,100% { transform: translateY(-${SCALE}px); }
}
@keyframes frameA {
  0%, 49% { opacity: 1; }
  50%,100% { opacity: 0; }
}
@keyframes frameB {
  0%, 49% { opacity: 0; }
  50%,100% { opacity: 1; }
}
.catw-walk   { animation: catWalk 16s linear infinite; position: absolute; bottom: 0; }
.catw-bob    { animation: pixelBob 0.28s steps(1,end) infinite; }
.catw-frmA   { animation: frameA  0.28s steps(1,end) infinite; }
.catw-frmB   { animation: frameB  0.28s steps(1,end) infinite; }
`

export default function CatWalker() {
  const W_px = 14 * SCALE
  const H_px = 13 * SCALE

  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: H_px,
        pointerEvents: 'none',
        zIndex: 31,
        overflow: 'visible',
      }}>
        <div className="catw-walk">
          <div className="catw-bob">
            <svg
              viewBox={`0 0 14 13`}
              width={W_px}
              height={H_px}
              style={{ imageRendering: 'pixelated', display: 'block' }}
            >
              <PixelGrid rows={STATIC} />

              {/* Walking frame A */}
              <g className="catw-frmA">
                <PixelGrid rows={LEGS_A} offsetY={10} />
              </g>

              {/* Walking frame B */}
              <g className="catw-frmB">
                <PixelGrid rows={LEGS_B} offsetY={10} />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
