import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface FrameProps extends Placement {
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** An outline region drawn around other entities; it never owns their layout. */
export function Frame({ id, className, style, children, ...place }: FrameProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="frame"
      data-presentation-id={id}
      className={className}
      style={placementStyle({ x: 0, y: 0, ...place }, style)}
    >
      {children}
    </motion.div>
  )
}
