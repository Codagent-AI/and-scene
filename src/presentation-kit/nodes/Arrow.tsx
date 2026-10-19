import { motion } from 'motion/react'
import type { CSSProperties, SVGAttributes } from 'react'
import { DESIGN_H, DESIGN_W } from '../constants.ts'
import { leave } from './shared.ts'

type Point = readonly [number, number]

export interface ArrowProps extends Omit<SVGAttributes<SVGSVGElement>, 'from' | 'to' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  layoutId: string
  from: Point
  to: Point
  /** Quadratic control point; makes the arrow an arc. */
  via?: Point
  bidirectional?: boolean
  /** Design canvas size the arrow's viewBox covers. */
  canvas?: { width: number; height: number }
}

const HEAD = 9

function head(tip: Point, toward: Point): string {
  const a = Math.atan2(tip[1] - toward[1], tip[0] - toward[0])
  const p = (da: number): string =>
    `${tip[0] - HEAD * Math.cos(a + da)},${tip[1] - HEAD * Math.sin(a + da)}`
  return `${tip[0]},${tip[1]} ${p(0.45)} ${p(-0.45)}`
}

/** A line or arc between two canvas points, with arrowheads drawn in currentColor. */
export function Arrow({ layoutId, from, to, via, bidirectional, canvas, style, ...rest }: ArrowProps) {
  const w = canvas?.width ?? DESIGN_W
  const h = canvas?.height ?? DESIGN_H
  const d = via ? `M${from[0]},${from[1]} Q${via[0]},${via[1]} ${to[0]},${to[1]}` : `M${from[0]},${from[1]} L${to[0]},${to[1]}`
  const abs: CSSProperties = { position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'visible', pointerEvents: 'none' }
  return (
    <motion.svg
      {...(rest as object)}
      viewBox={`0 0 ${w} ${h}`}
      exit={leave}
      style={{ ...abs, ...style }}
      data-presentation-node="arrow"
      data-presentation-entity={layoutId}
    >
      <path d={d} fill="none" stroke="currentColor" data-presentation-arrow-line="" />
      <polygon fill="currentColor" points={head(to, via ?? from)} data-presentation-arrow-head="" />
      {bidirectional ? <polygon fill="currentColor" points={head(from, via ?? to)} data-presentation-arrow-head="" /> : null}
    </motion.svg>
  )
}
