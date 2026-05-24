// Pixel art cat — 14×12 sprite at 4× scale = 56×48 px
// Rounded oval body, 2 chunky leg pairs, no spider legs

const O = '#FF8C00'  // orange
const D = '#7A3000'  // dark outline
const W = '#FFE8C0'  // eye white
const K = '#1A0800'  // pupil
const P = '#FF8888'  // pink nose / inner ear
const _ = null

//                   0   1   2   3   4   5   6   7   8   9  10  11  12  13
const STATIC: (string|null)[][] = [
  [ _,  _,  _,  _,  _,  _,  _,  _,  _,  D,  _,  D,  _,  _ ], // R0  ear tips
  [ D,  _,  _,  _,  _,  _,  _,  _,  D,  O,  D,  O,  D,  _ ], // R1  tail-tip + ears
  [ D,  _,  _,  _,  _,  _,  _,  D,  O,  P,  D,  P,  O,  D ], // R2  tail + inner ears
  [ _,  D,  _,  _,  _,  _,  D,  O,  O,  O,  D,  O,  O,  D ], // R3  tail + head upper
  [ _,  D,  _,  _,  _,  D,  O,  W,  K,  O,  O,  W,  K,  D ], // R4  tail + eyes
  [ _,  _,  D,  D,  D,  O,  O,  O,  O,  O,  O,  P,  D,  _ ], // R5  tail-base + nose
  [ _,  _,  _,  D,  O,  O,  D,  O,  O,  O,  D,  O,  D,  _ ], // R6  body + stripes
  [ _,  _,  _,  D,  O,  O,  O,  O,  O,  O,  O,  O,  D,  _ ], // R7  body smooth
  [ _,  _,  _,  _,  D,  D,  D,  D,  D,  D,  D,  D,  _,  _ ], // R8  body bottom
]

// Frame A — legs spread (foot-strike pose)
//                   0   1   2   3   4   5   6   7   8   9  10  11  12  13
const LEGS_A: (string|null)[][] = [
  [ _,  _,  _,  _,  D,  D,  _,  _,  _,  D,  D,  _,  _,  _ ], // R9
  [ _,  _,  _,  _,  D,  D,  _,  _,  _,  D,  D,  _,  _,  _ ], // R10
  [ _,  _,  _,  _,  D,  D,  _,  _,  _,  D,  D,  _,  _,  _ ], // R11
]

// Frame B — legs pulled in (mid-swing pose)
//                   0   1   2   3   4   5   6   7   8   9  10  11  12  13
const LEGS_B: (string|null)[][] = [
  [ _,  _,  _,  _,  _,  D,  D,  _,  D,  D,  _,  _,  _,  _ ], // R9
  [ _,  _,  _,  _,  _,  D,  D,  _,  D,  D,  _,  _,  _,  _ ], // R10
  [ _,  _,  _,  _,  _,  D,  D,  _,  D,  D,  _,  _,  _,  _ ], // R11
]

const SCALE = 4

function PixelGrid({ rows, offsetY = 0 }: { rows: (string|null)[][]; offsetY?: number }) {
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

const W_PX = 14 * SCALE
const H_PX = 12 * SCALE

const CAT_CSS = `
@keyframes catWalk {
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
.catw-walk  { animation: catWalk 18s linear infinite; position: absolute; bottom: 0; }
.catw-bob   { animation: pixelBob 0.25s steps(1,end) infinite; }
.catw-frm-a { animation: catFrmA  0.25s steps(1,end) infinite; }
.catw-frm-b { animation: catFrmB  0.25s steps(1,end) infinite; }
`

export default function CatWalker() {
  return (
    <>
      <style>{CAT_CSS}</style>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: H_PX, pointerEvents: 'none', zIndex: 31, overflow: 'visible',
      }}>
        <div className="catw-walk">
          <div className="catw-bob">
            <svg
              viewBox="0 0 14 12"
              width={W_PX}
              height={H_PX}
              style={{ imageRendering: 'pixelated', display: 'block' }}
            >
              <PixelGrid rows={STATIC} />
              <g className="catw-frm-a"><PixelGrid rows={LEGS_A} offsetY={9} /></g>
              <g className="catw-frm-b"><PixelGrid rows={LEGS_B} offsetY={9} /></g>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
