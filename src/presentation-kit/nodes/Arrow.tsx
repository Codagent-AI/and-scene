import { motion } from 'motion/react'
import { LAYOUT_TRANSITION } from '../motion'
import { arrowHead, arrowShaft, control, type Point } from './arrowGeometry'

export interface ArrowProps {
  id: string
  from: Point
  to: Point
  /** Perpendicular offset of the control point; 0 draws a straight line. */
  bend?: number
  bidirectional?: boolean
  headSize?: number
  className?: string
  style?: React.CSSProperties
}

/** An SVG arrow whose endpoints animate in place when its coordinates change. */
export function Arrow({ id, from, to, bend = 0, bidirectional = false, headSize = 8, className, style }: ArrowProps) {
  const c = control(from, to, bend)
  const endHead = arrowHead(to, c, headSize)
  const startHead = bidirectional ? arrowHead(from, c, headSize) : arrowHead(from, from, 0)
  return (
    <svg
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <motion.path data-presentation-arrow-shaft="" fill="none" stroke="currentColor" initial={false} animate={{ d: arrowShaft(from, to, bend) }} transition={LAYOUT_TRANSITION.layout} />
      <motion.path data-presentation-arrow-head="end" fill="currentColor" stroke="none" initial={false} animate={{ d: endHead }} transition={LAYOUT_TRANSITION.layout} />
      {bidirectional && (
        <motion.path data-presentation-arrow-head="start" fill="currentColor" stroke="none" initial={false} animate={{ d: startHead }} transition={LAYOUT_TRANSITION.layout} />
      )}
    </svg>
  )
}
