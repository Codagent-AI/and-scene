import { AnimatePresence, motion } from 'motion/react'
import { useId } from 'react'
import { arrowPath, type Point } from './geometry.ts'
import { DESIGN_H, DESIGN_W, EASE, ENTER_DELAY, ENTER_T, EXIT_T, LAYOUT_T } from '../constants.ts'

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Control point for a quadratic curve; straight when omitted. */
  curve?: Point
  /** Arrowhead at the start as well. */
  bidirectional?: boolean
  when?: boolean
  className?: string
}

/** Line or curve between canvas points, drawn in an SVG layer; stroke follows `currentColor`. */
export function Arrow({ id, from, to, curve, bidirectional = false, when = true, className }: ArrowProps) {
  const uid = useId()
  const headId = `${uid}-head`
  return (
    <AnimatePresence>
      {when ? (
        <motion.svg
          key="arrow"
          data-presentation-node="arrow"
          data-presentation-id={id}
          className={className}
          width={DESIGN_W}
          height={DESIGN_H}
          viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
          style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: ENTER_DELAY, duration: ENTER_T } }}
          exit={{ opacity: 0, transition: { duration: EXIT_T } }}
        >
          <defs>
            <marker id={headId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <motion.path
            data-presentation-arrow-line=""
            fill="none"
            stroke="currentColor"
            markerEnd={`url(#${headId})`}
            markerStart={bidirectional ? `url(#${headId})` : undefined}
            initial={{ d: arrowPath(from, to, curve) }}
            animate={{ d: arrowPath(from, to, curve) }}
            transition={{ duration: LAYOUT_T, ease: EASE }}
          />
        </motion.svg>
      ) : null}
    </AnimatePresence>
  )
}
