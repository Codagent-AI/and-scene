import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_T } from '../constants.ts'
import { placementStyle, type NodeHooks } from './placement.ts'

export interface EmphasisProps extends NodeHooks {
  children?: ReactNode
}

/** A marker drawn over or around another entity (ring, flag, highlight). */
export function Emphasis({ id, at, className, style, variant, children }: EmphasisProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={placementStyle(at, { pointerEvents: 'none', ...style })}
      data-presentation-node="emphasis"
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      {children}
    </motion.div>
  )
}
