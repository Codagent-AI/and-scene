import { useEffect, useId, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants.ts'
import type { Point } from './common.ts'

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  /** Perpendicular bulge (design px) that turns the line into an arc. */
  bend?: number
  /** Dashed styling is the author's call; this only sets `data-dashed`. */
  dashed?: boolean
  className?: string
  style?: CSSProperties
  canvas?: { width: number; height: number }
}

/** Last drawn path per arrow id, so a remounted arrow (another step's scene) morphs from where its predecessor was. */
const lastPath = new Map<string, string>()

const pathFor = (from: Point, to: Point, bend: number) => {
  if (!bend) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = mx + (-dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
}

/**
 * A connector between two canvas points. Rendered as a full-canvas SVG so it
 * never affects other entities' layout; stroke and fill inherit `currentColor`.
 */
export function Arrow({ id, from, to, bidirectional, bend = 0, dashed, className, style, canvas }: ArrowProps) {
  const marker = useId()
  const w = canvas?.width ?? DESIGN_W
  const h = canvas?.height ?? DESIGN_H
  const transition = { duration: LAYOUT_T, ease: EASE }
  const d = pathFor(from, to, bend)
  const [initialD] = useState(() => lastPath.get(id))
  useEffect(() => {
    lastPath.set(id, d)
  }, [id, d])
  return (
    <svg
      data-presentation-node="arrow"
      data-entity={id}
      data-dashed={dashed ? 'true' : undefined}
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none" />
        </marker>
      </defs>
      <motion.path
        fill="none"
        stroke="currentColor"
        initial={initialD ? { d: initialD } : false}
        animate={{ d }}
        transition={transition}
        markerEnd={`url(#${marker})`}
        markerStart={bidirectional ? `url(#${marker})` : undefined}
      />
    </svg>
  )
}
