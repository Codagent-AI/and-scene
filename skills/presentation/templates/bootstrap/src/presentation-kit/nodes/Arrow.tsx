import { motion } from 'motion/react'
import { useId, type CSSProperties } from 'react'
import { LAYOUT_TRANSITION } from './shared'

export interface ArrowProps {
  id: string
  from: [number, number]
  to: [number, number]
  /** Quadratic control point; the arrow is a straight line when omitted. */
  bend?: [number, number]
  /** Draw a head at the start as well as the end. */
  both?: boolean
  className?: string
  style?: CSSProperties
}

/** Room around the path for the arrowheads and stroke. */
const PAD = 12

/**
 * Line or curved arrow in design-canvas pixels. The svg is sized to the
 * arrow's own bounds and carries a `layoutId`, so a persisting arrow morphs in
 * place, including across scene instances. Stroke and fill inherit
 * `currentColor`, so presentation CSS owns colour and weight.
 */
export function Arrow({ id, from, to, bend, both, className, style }: ArrowProps) {
  const marker = useId()
  const points = bend ? [from, to, bend] : [from, to]
  const minX = Math.min(...points.map((p) => p[0])) - PAD
  const minY = Math.min(...points.map((p) => p[1])) - PAD
  const width = Math.max(...points.map((p) => p[0])) + PAD - minX
  const height = Math.max(...points.map((p) => p[1])) + PAD - minY
  const [x1, y1] = [from[0] - minX, from[1] - minY]
  const [x2, y2] = [to[0] - minX, to[1] - minY]
  const d = bend
    ? `M ${x1} ${y1} Q ${bend[0] - minX} ${bend[1] - minY} ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`
  return (
    <motion.svg
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="arrow"
      data-presentation-id={id}
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width,
        height,
        overflow: 'visible',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <path
        data-presentation-arrow-path=""
        d={d}
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        markerEnd={`url(#${marker})`}
        markerStart={both ? `url(#${marker})` : undefined}
      />
    </motion.svg>
  )
}
