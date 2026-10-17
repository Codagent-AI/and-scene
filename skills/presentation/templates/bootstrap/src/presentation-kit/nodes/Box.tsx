import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { LAYOUT_TRANSITION } from '../constants.ts'

export interface NodeProps {
  /** Stable entity identity; doubles as the motion `layoutId`. */
  id: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export interface BoxProps extends NodeProps {
  /** Optional Lucide icon component rendered before the children. */
  icon?: LucideIcon
  /** Semantic kind exposed as `data-presentation-node`. */
  kind?: string
}

/** Generic positioned entity that morphs in place when its position, size or content changes. */
export function Box({ id, icon: Icon, kind = 'box', className, style, children }: BoxProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node={kind}
      data-presentation-id={id}
      className={className}
      style={{ position: 'absolute', ...style }}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-icon="" /> : null}
      {children}
    </motion.div>
  )
}
