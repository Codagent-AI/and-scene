import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, placementStyle, type NodeBaseProps } from './shared.ts'

export interface EmphasisProps
  extends NodeBaseProps,
    Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'className' | 'id' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {}

/** A marker laid over an entity to call attention to it. */
export function Emphasis({ id, x, y, w, h, className, style, children, ...rest }: EmphasisProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-emphasis=""
      data-presentation-entity={id}
    >
      {children}
    </motion.div>
  )
}
