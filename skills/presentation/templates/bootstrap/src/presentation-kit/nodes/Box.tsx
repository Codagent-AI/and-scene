import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { atStyle, entityMotion, type At, type NodeHooks } from './shared'

export interface BoxProps extends NodeHooks, Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'style' | 'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  at?: At
  /** Optional glyph rendered as a component, e.g. a lucide-react icon. */
  Icon?: LucideIcon
  children?: ReactNode
}

export function Box({ id, at, Icon, className, style, children, ...rest }: BoxProps) {
  return (
    <motion.div
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="box"
      data-presentation-id={id}
      className={className}
      style={atStyle(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
