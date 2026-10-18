import { motion } from 'motion/react'
import { geometry } from './geometry'
import type { NodeProps } from './Node'

interface Point {
  x: number
  y: number
}

interface ArrowProps extends Omit<NodeProps, 'at' | 'children' | 'Icon'> {
  from: Point
  to: Point
  /** Draw a head at both ends. */
  both?: boolean
}

const PAD = 8
const HEAD = 7

function head(tip: Point, from: Point): string {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x)
  const p = (da: number, len: number) =>
    `${tip.x - len * Math.cos(angle + da)},${tip.y - len * Math.sin(angle + da)}`
  return `${tip.x},${tip.y} ${p(0.5, HEAD)} ${p(-0.5, HEAD)}`
}

/** A straight arrow between two canvas points; its colors come from presentation CSS. */
export function Arrow({ id, from, to, both, z, style, ...rest }: ArrowProps) {
  const x = Math.min(from.x, to.x) - PAD
  const y = Math.min(from.y, to.y) - PAD
  const w = Math.abs(to.x - from.x) + PAD * 2
  const h = Math.abs(to.y - from.y) + PAD * 2
  const a = { x: from.x - x, y: from.y - y }
  const b = { x: to.x - x, y: to.y - y }
  return (
    <motion.div
      layout
      layoutId={id}
      data-presentation-node="arrow"
      data-presentation-entity={id}
      {...rest}
      style={{ ...geometry({ x, y, w, h }, z), ...style }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <line data-presentation-arrow-line="" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        <polygon data-presentation-arrow-head="" points={head(b, a)} />
        {both && <polygon data-presentation-arrow-head="" points={head(a, b)} />}
      </svg>
    </motion.div>
  )
}
