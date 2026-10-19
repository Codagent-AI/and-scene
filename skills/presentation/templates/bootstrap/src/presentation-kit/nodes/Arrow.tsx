import { motion } from 'motion/react'
import { EXIT_TRANSITION, LAYOUT_TRANSITION, enterProps } from './motion'

// Endpoints and bend are SVG attributes, so they are interpolated explicitly rather than snapping.
const GEOMETRY_TRANSITION = LAYOUT_TRANSITION
import type { NodeProps } from './node'

export interface ArrowProps extends Pick<NodeProps, 'id' | 'className' | 'style' | 'hooks' | 'enter'> {
  /** Endpoints in canvas coordinates. */
  from: readonly [number, number]
  to: readonly [number, number]
  /** Perpendicular offset of the curve's midpoint; 0 draws a straight line. */
  bend?: number
  /** Draw a head at the start as well as the end. */
  bidirectional?: boolean
  headSize?: number
}

function head(tip: readonly [number, number], toward: readonly [number, number], size: number) {
  const angle = Math.atan2(tip[1] - toward[1], tip[0] - toward[0])
  const spread = Math.PI / 7
  const point = (a: number) =>
    `${tip[0] - size * Math.cos(a)},${tip[1] - size * Math.sin(a)}`
  return `${tip[0]},${tip[1]} ${point(angle - spread)} ${point(angle + spread)}`
}

/**
 * A line or curve between two canvas points. Stroke and fill come from presentation CSS via the
 * `data-presentation-arrow-line` and `data-presentation-arrow-head` hooks.
 */
export function Arrow({
  id,
  from,
  to,
  bend = 0,
  bidirectional = false,
  headSize = 9,
  className,
  style,
  hooks,
  enter,
}: ArrowProps) {
  const mx = (from[0] + to[0]) / 2
  const my = (from[1] + to[1]) / 2
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1
  const cx = mx + (-(to[1] - from[1]) / len) * bend * 2
  const cy = my + ((to[0] - from[0]) / len) * bend * 2
  const d = `M${from[0]},${from[1]} Q${cx},${cy} ${to[0]},${to[1]}`
  const startToward: readonly [number, number] = bend ? [cx, cy] : to
  const endFrom: readonly [number, number] = bend ? [cx, cy] : from
  const endHead = head(to, endFrom, headSize)
  const startHead = head(from, startToward, headSize)
  return (
    <motion.svg
      layout
      layoutId={id}
      {...enterProps(enter)}
      transition={{ layout: LAYOUT_TRANSITION }}
      exit={{ opacity: 0, transition: EXIT_TRANSITION }}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', ...style }}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      {...hooks}
    >
      <motion.path initial={{ d }} animate={{ d }} transition={GEOMETRY_TRANSITION} fill="none" data-presentation-arrow-line="" />
      <motion.polygon
        initial={{ points: endHead }}
        animate={{ points: endHead }}
        transition={GEOMETRY_TRANSITION}
        data-presentation-arrow-head="end"
      />
      {bidirectional && (
        <motion.polygon
          initial={{ points: startHead }}
          animate={{ points: startHead }}
          transition={GEOMETRY_TRANSITION}
          data-presentation-arrow-head="start"
        />
      )}
    </motion.svg>
  )
}
