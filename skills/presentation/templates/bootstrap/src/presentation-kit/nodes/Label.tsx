import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { atStyle, entityMotion, type At, type NodeHooks } from './shared'

export interface LabelProps extends NodeHooks, Omit<HTMLAttributes<HTMLSpanElement>, 'id' | 'style' | 'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  at?: At
  children?: ReactNode
}

export function Label({ id, at, className, style, children, ...rest }: LabelProps) {
  return (
    <motion.span
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="label"
      data-presentation-id={id}
      className={className}
      style={atStyle(at, style)}
    >
      {children}
    </motion.span>
  )
}
