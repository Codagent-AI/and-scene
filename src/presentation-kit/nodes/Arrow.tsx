import { useId, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { arrowPath } from './arrowPath.ts'
import { DESIGN_H, DESIGN_W, EASE, LAYOUT_T } from '../constants.ts'

export interface ArrowProps {
  id?: string
  /** Start and end points in design-canvas coordinates. */
  from: readonly [number, number]
  to: readonly [number, number]
  /** Perpendicular offset of a quadratic curve; 0 draws a straight line. */
  bend?: number
  head?: 'end' | 'both' | 'none'
  className?: string
  style?: CSSProperties
  canvas?: { width: number; height: number }
  /** Author data attributes (`data-*`) are forwarded to the svg. */
  [dataAttribute: `data-${string}`]: string | undefined
}

export function Arrow({ id, from, to, bend = 0, head = 'end', className, style, canvas, ...rest }: ArrowProps) {
  const marker = useId()
  const d = arrowPath(from, to, bend)
  const width = canvas?.width ?? DESIGN_W
  const height = canvas?.height ?? DESIGN_H
  return (
    <motion.svg
      {...rest}
      layoutId={id}
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style }}
      data-presentation-arrow=""
      data-presentation-entity={id}
      data-presentation-arrow-head={head}
      aria-hidden="true"
    >
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <motion.path
        initial={false}
        animate={{ d }}
        transition={{ duration: LAYOUT_T, ease: EASE }}
        d={d}
        fill="none"
        stroke="currentColor"
        markerEnd={head === 'none' ? undefined : `url(#${marker})`}
        markerStart={head === 'both' ? `url(#${marker})` : undefined}
        data-presentation-arrow-path=""
      />
    </motion.svg>
  )
}
