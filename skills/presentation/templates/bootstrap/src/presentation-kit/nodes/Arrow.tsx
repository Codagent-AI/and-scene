import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { hooks } from './nodeProps'
import type { NodeProps } from './nodeProps'

interface ArrowProps extends Omit<NodeProps, 'x' | 'y' | 'width' | 'height'> {
  from: { x: number; y: number }
  to: { x: number; y: number }
  /** Draw a head at both ends. */
  bidirectional?: boolean
}

const HEAD = 8

function head(at: ArrowProps['to'], other: ArrowProps['to']) {
  const angle = Math.atan2(at.y - other.y, at.x - other.x)
  const point = (a: number) =>
    `${at.x - HEAD * Math.cos(angle + a)},${at.y - HEAD * Math.sin(angle + a)}`
  return `${at.x},${at.y} ${point(Math.PI / 6)} ${point(-Math.PI / 6)}`
}

/** A line between two canvas points. Stroke and fill inherit `currentColor` from the author's CSS. */
export function Arrow(props: ArrowProps) {
  const { from, to, bidirectional, className, style } = props
  const pad = HEAD
  const left = Math.min(from.x, to.x) - pad
  const top = Math.min(from.y, to.y) - pad
  const width = Math.abs(from.x - to.x) + pad * 2
  const height = Math.abs(from.y - to.y) + pad * 2
  const local = (p: ArrowProps['to']) => ({ x: p.x - left, y: p.y - top })
  const a = local(from)
  const b = local(to)
  return (
    <motion.svg
      layoutId={props.id}
      className={className}
      style={{ position: 'absolute', left, top, width, height, overflow: 'visible', ...style }}
      viewBox={`0 0 ${width} ${height}`}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...hooks('arrow', props)}
    >
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" />
      <polygon points={head(b, a)} fill="currentColor" />
      {bidirectional && <polygon points={head(a, b)} fill="currentColor" />}
    </motion.svg>
  )
}
