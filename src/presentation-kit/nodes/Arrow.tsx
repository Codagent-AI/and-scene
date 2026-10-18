import { useId } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { useEnterMotion } from './useEnterMotion'
import { EXIT, entityAttributes } from './shared'
import type { DataAttributes } from './shared'

type Point = readonly [number, number]

export interface ArrowProps extends DataAttributes {
  id: string
  className?: string
  from: Point
  to: Point
  /** Control point that bends the arrow into a quadratic curve. */
  via?: Point
  bidirectional?: boolean
  emphasis?: boolean
  /** Fade in when first mounted, after persisting entities settle. */
  appear?: boolean
}

const PAD = 10

/** Line or curve between two canvas points. Stroke and fill inherit `currentColor`. */
export function Arrow({
  id,
  className,
  from,
  to,
  via,
  bidirectional,
  emphasis,
  appear,
  ...data
}: ArrowProps) {
  const enter = useEnterMotion(appear)
  const markerId = useId()
  const points = via ? [from, via, to] : [from, to]
  const left = Math.min(...points.map((p) => p[0])) - PAD
  const top = Math.min(...points.map((p) => p[1])) - PAD
  const right = Math.max(...points.map((p) => p[0])) + PAD
  const bottom = Math.max(...points.map((p) => p[1])) + PAD
  const local = (p: Point) => `${p[0] - left} ${p[1] - top}`
  const d = via
    ? `M ${local(from)} Q ${local(via)} ${local(to)}`
    : `M ${local(from)} L ${local(to)}`

  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={EXIT}
      {...enter}
      className={className}
      style={{
        position: 'absolute',
        left,
        top,
        width: right - left,
        height: bottom - top,
        pointerEvents: 'none',
      }}
      {...entityAttributes(id, 'arrow', emphasis)}
      {...data}
    >
      <svg width={right - left} height={bottom - top} style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          markerEnd={`url(#${markerId})`}
          markerStart={bidirectional ? `url(#${markerId})` : undefined}
        />
      </svg>
    </motion.div>
  )
}
