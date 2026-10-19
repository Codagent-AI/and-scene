import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { leave, morph, place } from './shared.ts'
import type { NodeProps } from './shared.ts'

export interface LabelProps extends NodeProps {
  children?: ReactNode
}

export function Label({ layoutId, x, y, w, h, children, style, ...rest }: LabelProps) {
  return (
    <motion.div
      {...(rest as object)}
      layout
      layoutId={layoutId}
      transition={morph}
      exit={leave}
      style={place({ x, y, w, h }, style)}
      data-presentation-node="label"
      data-presentation-entity={layoutId}
    >
      {children}
    </motion.div>
  )
}
