import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { atStyle, entityMotion, type At, type NodeHooks } from './shared'

export interface FrameProps extends NodeHooks, Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'style' | 'className' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  at?: At
  /** Free-form variant name exposed as `data-presentation-variant` for author CSS. */
  variant?: string
  children?: ReactNode
}

/** An outline region around other entities; the kit draws nothing itself. */
export function Frame({ id, at, variant, className, style, children, ...rest }: FrameProps) {
  return (
    <motion.div
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="frame"
      data-presentation-id={id}
      data-presentation-variant={variant}
      className={className}
      style={atStyle(at, style)}
    >
      {children}
    </motion.div>
  )
}
