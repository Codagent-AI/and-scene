import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from './geometry'

export type Point = readonly [x: number, y: number]

export interface ArrowProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId'> {
  id: string
  from: Point
  to: Point
  /** Sideways pull of the midpoint, for curved connections. */
  bend?: number
  /** Heads on both ends. */
  bidirectional?: boolean
}

const PAD = 8

/**
 * A connector between two canvas points. The line takes its stroke from the
 * inherited `currentColor`; presentation CSS styles `[data-presentation-arrow-line]`.
 */
export function Arrow({ id, from, to, bend = 0, bidirectional, style, ...rest }: ArrowProps) {
  const left = Math.min(from[0], to[0]) - PAD
  const top = Math.min(from[1], to[1]) - PAD
  const width = Math.abs(to[0] - from[0]) + PAD * 2
  const height = Math.abs(to[1] - from[1]) + PAD * 2
  const [x1, y1, x2, y2] = [from[0] - left, from[1] - top, to[0] - left, to[1] - top]
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy) || 1
  const cx = (x1 + x2) / 2 - (dy / length) * bend
  const cy = (y1 + y2) / 2 + (dx / length) * bend
  const d = bend ? `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`
  const head = `${id}-head`
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="arrow"
      data-presentation-id={id}
      style={{ position: 'absolute', left, top, width, height, pointerEvents: 'none', ...style }}
      {...rest}
    >
      <svg width={width} height={height} overflow="visible" aria-hidden>
        <defs>
          <marker id={head} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" fill="currentColor" />
          </marker>
        </defs>
        <path
          data-presentation-arrow-line
          d={d}
          fill="none"
          stroke="currentColor"
          markerEnd={`url(#${head})`}
          markerStart={bidirectional ? `url(#${head})` : undefined}
        />
      </svg>
    </motion.div>
  )
}
