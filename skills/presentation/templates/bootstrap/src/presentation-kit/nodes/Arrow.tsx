import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants.ts'

export interface Point {
  x: number
  y: number
}

export type ArrowProps = {
  id: string
  className?: string
  from: Point
  to: Point
  /** Draw a head at both ends. */
  bidirectional?: boolean
  headSize?: number
  style?: CSSProperties
} & { [attr: `data-${string}`]: string | number | boolean | undefined }

function head(tip: Point, tail: Point, size: number): string {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x)
  const wing = (offset: number): string => {
    const a = angle + Math.PI + offset
    return `${tip.x + size * Math.cos(a)},${tip.y + size * Math.sin(a)}`
  }
  return `${tip.x},${tip.y} ${wing(0.45)} ${wing(-0.45)}`
}

/** Line with arrowheads across the canvas; strokes inherit `currentColor`. */
export function Arrow({ id, from, to, bidirectional = false, headSize = 9, style, ...rest }: ArrowProps) {
  return (
    <motion.svg
      {...rest}
      layoutId={id}
      data-presentation-entity={id}
      data-presentation-node="arrow"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}
    >
      <motion.line
        stroke="currentColor"
        initial={false}
        animate={{ x1: from.x, y1: from.y, x2: to.x, y2: to.y }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
      />
      <polygon fill="currentColor" points={head(to, from, headSize)} />
      {bidirectional && <polygon fill="currentColor" points={head(from, to, headSize)} />}
    </motion.svg>
  )
}
