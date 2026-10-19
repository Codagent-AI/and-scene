import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  id: string
  from: readonly [number, number]
  to: readonly [number, number]
  /** Draw an arrowhead at both ends. */
  twoWay?: boolean
  dashed?: boolean
  className?: string
  style?: CSSProperties
}

/** Line between two canvas points; color comes from `currentColor`, set by the presentation. */
export function Arrow({ id, from, to, twoWay, dashed, className, style }: ArrowProps) {
  const [x1, y1] = from
  const [x2, y2] = to
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const head = (x: number, y: number, a: number) => {
    const s = 8
    const p = (da: number) => `${x - s * Math.cos(a + da)},${y - s * Math.sin(a + da)}`
    return `${p(-0.45)} ${x},${y} ${p(0.45)}`
  }
  const left = Math.min(x1, x2) - 10
  const top = Math.min(y1, y2) - 10
  const width = Math.abs(x2 - x1) + 20
  const height = Math.abs(y2 - y1) + 20
  return (
    <motion.svg
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="arrow"
      data-presentation-id={id}
      data-presentation-two-way={twoWay ? 'true' : undefined}
      className={className}
      width={width}
      height={height}
      viewBox={`${left} ${top} ${width} ${height}`}
      style={{ position: 'absolute', left, top, overflow: 'visible', ...style }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      <polyline points={head(x2, y2, angle)} fill="none" stroke="currentColor" />
      {twoWay ? <polyline points={head(x1, y1, angle + Math.PI)} fill="none" stroke="currentColor" /> : null}
    </motion.svg>
  )
}
