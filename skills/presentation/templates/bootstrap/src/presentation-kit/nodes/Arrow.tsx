import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { arrowPath } from './arrowPath'
import type { Point } from './arrowPath'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Perpendicular bulge in canvas px; 0 draws a straight line. */
  curve?: number
  /** Draw a head at both ends. */
  bidirectional?: boolean
  className?: string
  style?: CSSProperties
}

export function Arrow({ id, from, to, curve = 0, bidirectional = false, className, style }: ArrowProps) {
  const d = arrowPath(from, to, curve)
  const end = `${id}-end`
  const start = `${id}-start`
  return (
    <svg
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      className={className}
      width="100%"
      height="100%"
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <defs>
        <marker id={end} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
        <marker id={start} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${end})`}
        markerStart={bidirectional ? `url(#${start})` : undefined}
        initial={{ d, opacity: 0 }}
        animate={{ d, opacity: 1, transition: { duration: LAYOUT_T, ease: EASE, opacity: { duration: ENTER_T, delay: ENTER_DELAY } } }}
        exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      />
    </svg>
  )
}
