import { useId, type SVGProps } from 'react'
import { motion } from 'motion/react'
import { arrowPath, type Point } from './arrowPath'
import { DESIGN_H, DESIGN_W, EASE, ENTER_DELAY, ENTER_T, LAYOUT_T } from '../constants'

export interface ArrowProps extends Omit<SVGProps<SVGSVGElement>, 'from' | 'to' | 'ref'> {
  /** Stable entity id for the arrow. */
  entity: string
  from: Point
  to: Point
  /** Perpendicular offset (design px) bending the arrow into an arc. */
  bend?: number
  /** Draw a head at both ends. */
  bidirectional?: boolean
  appear?: boolean
}

/**
 * An arrow in design-canvas coordinates. Endpoints animate in place when the
 * props change. Stroke follows `currentColor`; presentations style it via the
 * `data-presentation-node="arrow"` hook.
 */
export function Arrow({ entity, from, to, bend, bidirectional, appear = false, style, ...rest }: ArrowProps) {
  const uid = useId()
  const head = `${uid}-head`
  const tail = `${uid}-tail`
  return (
    <motion.svg
      data-presentation-node="arrow"
      data-presentation-entity={entity}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      initial={appear ? { opacity: 0 } : false}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay: appear ? ENTER_DELAY : 0 } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      {...(rest as object)}
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
        markerEnd={`url(#${head})`}
        markerStart={bidirectional ? `url(#${tail})` : undefined}
        initial={{ d: arrowPath(from, to, bend) }}
        animate={{ d: arrowPath(from, to, bend) }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
      />
    </motion.svg>
  )
}
