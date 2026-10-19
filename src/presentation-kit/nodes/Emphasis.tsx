import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface EmphasisProps extends Geometry {
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Marks an area as emphasized via `data-presentation-emphasis`; the look is presentation-owned. */
export function Emphasis({ id, className, style, children, ...geometry }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      data-presentation-emphasis="true"
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {children}
    </motion.div>
  )
}
