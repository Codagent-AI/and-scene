import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants'
import { appearMotion } from './appear'

export interface ArrowProps {
  id: string
  from: [number, number]
  to: [number, number]
  /** Draw a head at the start as well as the end. */
  both?: boolean
  dashed?: boolean
  className?: string
  style?: CSSProperties
  [dataAttr: `data-${string}`]: string | number | boolean | undefined
}

const HEAD = 8

function head(tip: [number, number], tail: [number, number]): string {
  const angle = Math.atan2(tip[1] - tail[1], tip[0] - tail[0])
  const point = (a: number): string =>
    `${tip[0] - HEAD * Math.cos(angle + a)},${tip[1] - HEAD * Math.sin(angle + a)}`
  return `${tip[0]},${tip[1]} ${point(0.45)} ${point(-0.45)}`
}

/**
 * A line between two canvas points. Colour comes from the presentation (`stroke` defaults to
 * `currentColor`, so the arrow inherits whatever the presentation sets).
 */
export function Arrow({ id, from, to, both, dashed, className, style, ...rest }: ArrowProps) {
  const transition = { duration: LAYOUT_T, ease: EASE }
  return (
    <motion.svg
      {...rest}
      width={DESIGN_W}
      height={DESIGN_H}
      viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
      {...appearMotion}
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible', ...style }}
    >
      <motion.line
        initial={{ x1: from[0], y1: from[1], x2: to[0], y2: to[1] }}
        animate={{ x1: from[0], y1: from[1], x2: to[0], y2: to[1] }}
        transition={transition}
        stroke="currentColor"
        strokeDasharray={dashed ? '6 5' : undefined}
      />
      <motion.polygon
        initial={{ points: head(to, from) }}
        animate={{ points: head(to, from) }}
        transition={transition}
        fill="currentColor"
      />
      {both ? (
        <motion.polygon
          initial={{ points: head(from, to) }}
          animate={{ points: head(from, to) }}
          transition={transition}
          fill="currentColor"
        />
      ) : null}
    </motion.svg>
  )
}
