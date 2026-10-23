import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { ENTER_DELAY, ENTER_T, EASE, LAYOUT_T } from '../constants'
import { useContinuesFromPrevious } from './useContinuesFromPrevious'
import { arrowBox, arrowPath } from './arrowPath'
import type { Point } from './arrowPath'

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

/**
 * An arrow is a positioned entity like any other: an HTML wrapper carries the layoutId and the box
 * geometry (Motion does not project layout onto a bare `svg`), so an arrow with the same id morphs
 * to its new geometry across steps, whether or not the scene instance persists. The svg inside is
 * drawn in the wrapper's local coordinates.
 */
export function Arrow({ id, from, to, curve = 0, bidirectional = false, className, style }: ArrowProps) {
  const box = arrowBox(from, to, curve)
  const local = (p: Point) => ({ x: p.x - box.x, y: p.y - box.y })
  const end = `${id}-end`
  const start = `${id}-start`
  const continues = useContinuesFromPrevious(id)
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      className={className}
      initial={continues ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      style={{ position: 'absolute', left: box.x, top: box.y, width: box.width, height: box.height, pointerEvents: 'none', ...style }}
    >
      <svg width={box.width} height={box.height} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <marker id={end} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
          </marker>
          <marker id={start} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
          </marker>
        </defs>
        <path
          d={arrowPath(local(from), local(to), curve)}
          fill="none"
          stroke="currentColor"
          markerEnd={`url(#${end})`}
          markerStart={bidirectional ? `url(#${start})` : undefined}
        />
      </svg>
    </motion.div>
  )
}
