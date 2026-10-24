import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_T } from '../constants.ts'
import { placementStyle, type NodeHooks } from './placement.ts'

export interface FrameProps extends NodeHooks {
  children?: ReactNode
}

/** A grouping region. Draws nothing by itself; presentation CSS targets the hook. */
export function Frame({ id, at, className, style, variant, children }: FrameProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_T}
      className={className}
      style={placementStyle(at, style)}
      data-presentation-node="frame"
      data-presentation-entity={id}
      data-presentation-variant={variant}
    >
      {children}
    </motion.div>
  )
}
