import type { CSSProperties } from 'react'
import type { Point, Rect } from './types.ts'

/** Absolute placement inside the design canvas. Geometry only, no look. */
export function rectStyle(rect?: Rect): CSSProperties {
  if (!rect) return {}
  return { position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h }
}

export interface ArrowGeometry {
  path: string
  /** Triangle points at `to`, pointing along the final tangent. */
  head: string
  /** Triangle points at `from`, pointing backwards; present for two-way arrows. */
  tail: string | null
}

const HEAD_LEN = 10
const HEAD_HALF = 5

function triangle(tip: Point, toward: Point): string {
  const dx = tip.x - toward.x
  const dy = tip.y - toward.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const bx = tip.x - ux * HEAD_LEN
  const by = tip.y - uy * HEAD_LEN
  const l = `${bx - uy * HEAD_HALF},${by + ux * HEAD_HALF}`
  const r = `${bx + uy * HEAD_HALF},${by - ux * HEAD_HALF}`
  return `${tip.x},${tip.y} ${l} ${r}`
}

/** Straight (or quadratic when `via` is given) arrow path with head triangles. */
export function arrowGeometry(
  from: Point,
  to: Point,
  via?: Point,
  bidirectional = false,
): ArrowGeometry {
  const path = via
    ? `M ${from.x} ${from.y} Q ${via.x} ${via.y} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  return {
    path,
    head: triangle(to, via ?? from),
    tail: bidirectional ? triangle(from, via ?? to) : null,
  }
}
