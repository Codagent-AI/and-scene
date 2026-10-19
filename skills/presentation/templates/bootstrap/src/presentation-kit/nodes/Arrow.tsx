import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
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
 *
 * The arrow is a positioned box (with a stable `layoutId`) wrapping an svg drawn in the
 * box's local coordinates, so it morphs in place across steps and across scene replacements
 * exactly like any other entity.
 */
export function Arrow({ id, from, to, both, dashed, className, style, ...rest }: ArrowProps) {
  const left = Math.min(from[0], to[0]) - HEAD
  const top = Math.min(from[1], to[1]) - HEAD
  const width = Math.abs(to[0] - from[0]) + 2 * HEAD
  const height = Math.abs(to[1] - from[1]) + 2 * HEAD
  const local = (p: [number, number]): [number, number] => [p[0] - left, p[1] - top]
  const a = local(from)
  const b = local(to)
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...appearMotion}
      {...rest}
      data-presentation-entity={id}
      data-presentation-kind="arrow"
      className={className}
      style={{ position: 'absolute', left, top, width, height, pointerEvents: 'none', ...style }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="currentColor" strokeDasharray={dashed ? '6 5' : undefined} />
        <polygon points={head(b, a)} fill="currentColor" />
        {both ? <polygon points={head(a, b)} fill="currentColor" /> : null}
      </svg>
    </motion.div>
  )
}
