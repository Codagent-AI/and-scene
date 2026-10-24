import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { arrowPath, type Point } from './geometry'
import type { DataProps } from './Node'
import { EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

export interface ArrowProps extends DataProps {
  id: string
  from: Point
  to: Point
  /** Quadratic control point for a curved arrow. */
  bend?: Point
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  dashed?: boolean
  className?: string
  style?: CSSProperties
}

/** Line or arc between two canvas points. Colors and stroke width come from presentation CSS. */
export function Arrow({ id, from, to, bend, bidirectional, dashed, className, style, ...hooks }: ArrowProps) {
  const d = arrowPath(from, to, bend)
  const head = `${id}-head`
  return (
    <motion.svg
      {...hooks}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
      exit={{ opacity: 0 }}
      transition={{ duration: ENTER_T }}
    >
      <defs>
        <marker id={head} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeDasharray={dashed ? '6 6' : undefined}
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${head})` : undefined}
        initial={{ d, pathLength: 0 }}
        animate={{ d, pathLength: 1 }}
        transition={{
          d: { duration: LAYOUT_T, ease: EASE },
          pathLength: { duration: ENTER_T, delay: ENTER_DELAY, ease: EASE },
        }}
      />
    </motion.svg>
  )
}
