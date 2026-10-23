import { motion, type HTMLMotionProps } from 'motion/react'
import { entityProps } from './geometry'

export interface ArrowProps extends Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId'> {
  entity: string
  from: readonly [number, number]
  to: readonly [number, number]
  /** Arrowheads at both ends. */
  bidirectional?: boolean
  /** Perpendicular bow of the path in canvas px; 0 draws a straight line. */
  curve?: number
}

const PAD = 8
const HEAD = 7

function head(x: number, y: number, angle: number): string {
  const a = (d: number) => [x - HEAD * Math.cos(angle + d), y - HEAD * Math.sin(angle + d)]
  const [x1, y1] = a(0.45)
  const [x2, y2] = a(-0.45)
  return `M${x1},${y1} L${x} ${y} L${x2},${y2}`
}

/** A line or arc between two canvas points. Stroke and colour come from the presentation via currentColor/CSS. */
export function Arrow({ entity, from, to, bidirectional, curve = 0, style, ...rest }: ArrowProps) {
  const left = Math.min(from[0], to[0]) - PAD - Math.abs(curve)
  const top = Math.min(from[1], to[1]) - PAD - Math.abs(curve)
  const right = Math.max(from[0], to[0]) + PAD + Math.abs(curve)
  const bottom = Math.max(from[1], to[1]) + PAD + Math.abs(curve)
  const w = right - left
  const h = bottom - top
  const [x1, y1, x2, y2] = [from[0] - left, from[1] - top, to[0] - left, to[1] - top]
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  const cx = mx + (-(y2 - y1) / len) * curve
  const cy = my + ((x2 - x1) / len) * curve
  const path = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`
  const endAngle = Math.atan2(y2 - cy, x2 - cx)
  const startAngle = Math.atan2(y1 - cy, x1 - cx)
  return (
    <motion.div
      {...entityProps(entity, 'arrow')}
      {...rest}
      style={{ position: 'absolute', left, top, width: w, height: h, pointerEvents: 'none', ...style }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }} aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" data-presentation-arrow-line="" />
        <path d={head(x2, y2, endAngle)} fill="none" stroke="currentColor" data-presentation-arrow-head="" />
        {bidirectional && <path d={head(x1, y1, startAngle)} fill="none" stroke="currentColor" data-presentation-arrow-head="" />}
      </svg>
    </motion.div>
  )
}
