import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { arrowPath, type Point } from './arrowPath'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Arrowheads on both ends. */
  both?: boolean
  /** Perpendicular control-point offset in canvas units; 0 draws a straight line. */
  bend?: number
  className?: string
  style?: CSSProperties
}

/** Line or arc between two canvas points. Stroke and fill follow `currentColor`. */
export function Arrow({ id, from, to, both, bend, className, style }: ArrowProps) {
  const end = `${id}-head-end`
  const start = `${id}-head-start`
  return (
    <svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      className={className}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', ...style }}
    >
      <defs>
        <marker id={end} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        <marker id={start} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        initial={false}
        animate={{ d: arrowPath(from, to, bend) }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${end})`}
        markerStart={both ? `url(#${start})` : undefined}
      />
    </svg>
  )
}
