import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'

export interface ArrowProps {
  id: string
  /** Endpoints in canvas coordinates. */
  from: [number, number]
  to: [number, number]
  /** Draw a head at both ends. */
  twoWay?: boolean
  className?: string
  style?: CSSProperties
}

const HEAD = 8

function head([x, y]: [number, number], [fx, fy]: [number, number]) {
  const a = Math.atan2(y - fy, x - fx)
  const p = (d: number) => `${x - HEAD * Math.cos(a + d)},${y - HEAD * Math.sin(a + d)}`
  return `${p(-0.45)} ${x},${y} ${p(0.45)}`
}

/** A straight connector. Strokes inherit `currentColor`; the presentation sets it. */
export function Arrow({ id, from, to, twoWay, className, style }: ArrowProps) {
  const [x1, y1] = from
  const [x2, y2] = to
  const pad = HEAD + 2
  const left = Math.min(x1, x2) - pad
  const top = Math.min(y1, y2) - pad
  return (
    <motion.svg
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="arrow"
      data-presentation-id={id}
      className={className}
      aria-hidden="true"
      width={Math.abs(x2 - x1) + pad * 2}
      height={Math.abs(y2 - y1) + pad * 2}
      style={{ position: 'absolute', left, top, overflow: 'visible', ...style }}
    >
      <g transform={`translate(${-left} ${-top})`} fill="none" stroke="currentColor">
        <line x1={x1} y1={y1} x2={x2} y2={y2} />
        <polyline points={head(to, from)} />
        {twoWay ? <polyline points={head(from, to)} /> : null}
      </g>
    </motion.svg>
  )
}
