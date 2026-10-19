import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  id: string
  from: readonly [number, number]
  to: readonly [number, number]
  /** Draw a head at the start as well as the end. */
  twoWay?: boolean
  emphasis?: boolean
  className?: string
  style?: CSSProperties
}

const HEAD = 8

function head(tip: readonly [number, number], tail: readonly [number, number]): string {
  const angle = Math.atan2(tip[1] - tail[1], tip[0] - tail[0])
  const p = (a: number): string =>
    `${tip[0] - HEAD * Math.cos(angle + a)},${tip[1] - HEAD * Math.sin(angle + a)}`
  return `${p(-Math.PI / 7)} ${tip[0]},${tip[1]} ${p(Math.PI / 7)}`
}

/** Line with arrowheads, drawn over the whole canvas. Stroke inherits currentColor. */
export function Arrow({ id, from, to, twoWay, emphasis, className, style }: ArrowProps) {
  return (
    <motion.svg
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      data-presentation-two-way={twoWay ? 'true' : undefined}
      data-presentation-emphasis={emphasis ? 'true' : undefined}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="currentColor" />
      <polyline points={head(to, from)} fill="none" stroke="currentColor" />
      {twoWay ? <polyline points={head(from, to)} fill="none" stroke="currentColor" /> : null}
    </motion.svg>
  )
}
