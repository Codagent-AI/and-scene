import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface Point {
  x: number
  y: number
}

export type ArrowProps = Omit<HTMLMotionProps<'div'>, 'ref' | 'id'> & {
  /** Stable identity recorded as `data-presentation-id`. */
  id: string
  from: Point
  to: Point
  /** Draws a head at both ends. */
  bidirectional?: boolean
}

/**
 * A line from `from` to `to`. The kit only positions and rotates it; presentation CSS draws the
 * line and heads on `[data-presentation-arrow-line]` and `[data-presentation-arrow-head]`.
 */
export function Arrow({ id, from, to, bidirectional, style, ...rest }: ArrowProps) {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
  const target = { left: from.x, top: from.y, width: length, rotate: angle }
  return (
    <motion.div
      data-presentation-node="arrow"
      data-presentation-id={id}
      data-presentation-arrow-direction={bidirectional ? 'both' : 'forward'}
      initial={target}
      animate={target}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      style={{ position: 'absolute', height: 0, transformOrigin: '0 50%', ...style }}
      {...rest}
    >
      <span data-presentation-arrow-line="" style={{ position: 'absolute', left: 0, right: 0, top: 0 }} />
      <span data-presentation-arrow-head="end" style={{ position: 'absolute', right: 0, top: 0 }} />
      {bidirectional && <span data-presentation-arrow-head="start" style={{ position: 'absolute', left: 0, top: 0 }} />}
    </motion.div>
  )
}
