import type { CSSProperties } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface EmphasisProps extends Placement {
  id: string
  className?: string
  style?: CSSProperties
}

/** A marker (ring, flag, highlight) that follows or flags another entity. */
export function Emphasis({ id, className, style, ...place }: EmphasisProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      aria-hidden="true"
      className={className}
      style={placementStyle({ x: 0, y: 0, ...place }, style)}
    />
  )
}
