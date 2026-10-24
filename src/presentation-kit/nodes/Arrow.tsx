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
  width: number
  height: number
  className?: string
  style?: CSSProperties
}

/**
 * Line or curved arrow in design-canvas pixels. Stroke and fill inherit
 * `currentColor`, so presentation CSS owns colour and weight.
 */
export function Arrow({ id, from, to, bend, both, width, height, className, style }: ArrowProps) {
  const marker = useId()
  const [x1, y1] = from
  const [x2, y2] = to
  const d = bend
    ? `M ${x1} ${y1} Q ${bend[0]} ${bend[1]} ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`
  return (
    <svg
      data-presentation-node="arrow"
      data-presentation-id={id}
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
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
      <motion.path
        data-presentation-arrow-path=""
        initial={false}
        animate={{ d }}
        transition={LAYOUT_TRANSITION}
        fill="none"
        stroke="currentColor"
        markerEnd={`url(#${marker})`}
        markerStart={both ? `url(#${marker})` : undefined}
      />
    </svg>
  )
}
