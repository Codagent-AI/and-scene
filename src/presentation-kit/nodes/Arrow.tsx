import { useId, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, ENTER_T, LAYOUT_T, EASE } from '../constants'
import { arrowPath } from './arrowPath'
import { exitProps, nodeHooks } from './shared'

interface ArrowProps {
  layoutId?: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Draw a head at both ends. */
  bidirectional?: boolean
  /** Perpendicular offset of the curve's control point; 0 draws a straight line. */
  bend?: number
  appear?: boolean
  variant?: string
  className?: string
  style?: CSSProperties
}

/** A line or curve with arrowheads drawn in `currentColor`; spans the whole canvas. */
export function Arrow({
  layoutId,
  from,
  to,
  bidirectional,
  bend,
  appear,
  variant,
  className,
  style,
}: ArrowProps) {
  const uid = useId().replace(/:/g, '')
  const head = `${uid}-head`
  const tail = `${uid}-tail`
  return (
    <motion.svg
      layoutId={layoutId}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      aria-hidden="true"
      className={className}
      {...nodeHooks('arrow', layoutId, variant)}
      initial={appear ? { opacity: 0 } : undefined}
      animate={{
        opacity: 1,
        transition: { duration: ENTER_T, delay: appear ? ENTER_DELAY : 0 },
      }}
      {...exitProps}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <defs>
        <marker id={head} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
        </marker>
        <marker id={tail} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${tail})` : undefined}
        initial={false}
        animate={{ d: arrowPath(from, to, bend) }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
      />
    </motion.svg>
  )
}
