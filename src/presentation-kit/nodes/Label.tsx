import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placementStyle, type Placement } from './geometry'

export interface LabelProps extends Placement {
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function Label({ id, className, style, children, ...place }: LabelProps) {
  return (
    <motion.span
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={placementStyle(place, style)}
    >
      {children}
    </motion.span>
  )
}
