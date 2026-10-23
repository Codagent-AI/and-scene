import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { LAYOUT_T, EASE } from '../constants.ts'
import { placementStyle, type DomPassthrough, type NodeProps, type Placement } from './shared.ts'

export interface LabelProps extends NodeProps, Placement, DomPassthrough {
  children?: ReactNode
}

export function Label({ id, x, y, w, h, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-node="label"
      data-presentation-entity={id}
    >
      {children}
    </motion.span>
  )
}
