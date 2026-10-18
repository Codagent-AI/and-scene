import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { atStyle, entityMotion, type At, type NodeHooks } from './shared'

export interface EmphasisProps extends NodeHooks, Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'style' | 'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  at?: At
  /** Emphasis state, exposed as `data-presentation-emphasized` so CSS can restyle it. */
  on?: boolean
  children?: ReactNode
}

export function Emphasis({ id, at, on = true, className, style, children, ...rest }: EmphasisProps) {
  return (
    <motion.div
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="emphasis"
      data-presentation-id={id}
      data-presentation-emphasized={on ? 'true' : 'false'}
      className={className}
      style={atStyle(at, style)}
    >
      {children}
    </motion.div>
  )
}
