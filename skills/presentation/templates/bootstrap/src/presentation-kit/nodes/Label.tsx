import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'
import { EASE, LAYOUT_T } from '../constants'

export interface LabelProps extends Omit<ComponentPropsWithoutRef<typeof motion.span>, 'layout'> {
  layoutId?: string
}

/** Text entity that can carry its own layoutId to morph independently of its parent box. */
export function Label({ layoutId, children, className, transition, ...rest }: LabelProps) {
  return (
    <motion.span
      layout={Boolean(layoutId)}
      layoutId={layoutId}
      data-presentation-label=""
      className={className}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.span>
  )
}
