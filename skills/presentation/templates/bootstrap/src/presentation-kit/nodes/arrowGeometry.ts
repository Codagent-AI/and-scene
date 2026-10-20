export interface Point {
  x: number
  y: number
}

export interface ArrowGeometry {
  left: number
  top: number
  width: number
  height: number
  line: { x1: number; y1: number; x2: number; y2: number }
  /** Arrow heads as polygon point lists in the svg's local coordinates. */
  heads: string[]
}

const HEAD = 9
const PAD = HEAD + 1

function head(tip: Point, from: Point): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const p = (a: number): string =>
    `${(tip.x - HEAD * Math.cos(angle + a)).toFixed(2)},${(tip.y - HEAD * Math.sin(angle + a)).toFixed(2)}`
  return `${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${p(0.45)} ${p(-0.45)}`
}

/** Bounding box, local line, and head polygons for an arrow between two canvas points. */
export function arrowGeometry(from: Point, to: Point, bidirectional = false): ArrowGeometry {
  const left = Math.min(from.x, to.x) - PAD
  const top = Math.min(from.y, to.y) - PAD
  const a = { x: from.x - left, y: from.y - top }
  const b = { x: to.x - left, y: to.y - top }
  return {
    left,
    top,
    width: Math.abs(from.x - to.x) + PAD * 2,
    height: Math.abs(from.y - to.y) + PAD * 2,
    line: { x1: a.x, y1: a.y, x2: b.x, y2: b.y },
    heads: bidirectional ? [head(b, a), head(a, b)] : [head(b, a)],
  }
}
