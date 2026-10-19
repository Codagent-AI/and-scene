import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { leave, morph, place } from './shared.ts'
import type { NodeProps } from './shared.ts'

export interface EntityNodeProps extends NodeProps {
  kind: string
  children?: ReactNode
}

/** Shared shell for positioned entities: stable identity, layout morph, fade-out, style hooks. */
export function EntityNode({ kind, layoutId, x, y, w, h, children, style, ...rest }: EntityNodeProps) {
  return (
    <motion.div
      {...(rest as object)}
      layout
      layoutId={layoutId}
      transition={morph}
      exit={leave}
      style={place({ x, y, w, h }, style)}
      data-presentation-node={kind}
      data-presentation-entity={layoutId}
    >
      {children}
    </motion.div>
  )
}
