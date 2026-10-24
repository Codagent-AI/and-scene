import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_T } from '../constants.ts'
import { placementStyle, type NodeHooks } from './placement.ts'

export interface LabelProps extends NodeHooks {
  children?: ReactNode
}

export function Label({ id, at, className, style, variant, children }: LabelProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={placementStyle(at, style)}
      data-presentation-node="label"
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      {children}
    </motion.div>
  )
}
