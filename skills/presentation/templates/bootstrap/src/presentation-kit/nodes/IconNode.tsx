import { motion } from 'motion/react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { LAYOUT_TRANSITION } from '../constants'

export interface IconNodeProps {
  /** Stable layoutId so this entity morphs across steps instead of remounting. */
  layoutId: string
  className?: string
  style?: CSSProperties
  Icon?: ComponentType<{ size?: number; className?: string }>
  iconClassName?: string
  children?: ReactNode
}

interface IconNodeImplProps extends IconNodeProps {
  node: string
  iconSize: number
}

/** Shared morphing entity with an optional Lucide glyph, behind Box and SymbolChip. */
export function IconNode({ node, iconSize, layoutId, className, style, Icon, iconClassName, children }: IconNodeImplProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={className}
      data-presentation-node={node}
      style={style}
      transition={LAYOUT_TRANSITION}
    >
      {Icon ? <Icon size={iconSize} className={iconClassName} /> : null}
      {children}
    </motion.div>
  )
}
