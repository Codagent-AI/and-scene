import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface EmphasisProps extends Geometry {
  id: string
  className?: string
  style?: CSSProperties
}

/** An emphasis marker (ring, highlight) placed over another entity's bounds. */
export function Emphasis({ id, className, style, ...geometry }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      aria-hidden="true"
      data-presentation-node="emphasis"
      data-presentation-id={id}
      className={className}
      style={{ pointerEvents: 'none', ...geometryStyle({ x: 0, y: 0, ...geometry }, style) }}
    />
  )
}
