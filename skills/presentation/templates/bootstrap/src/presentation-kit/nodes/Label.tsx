import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface LabelProps extends ComponentPropsWithoutRef<typeof motion.span> {
  layoutId?: string
}

export function Label({ layoutId, className, children, ...rest }: LabelProps) {
  return (
    <motion.span layoutId={layoutId} data-presentation-label="" className={className} {...rest}>
      {children}
    </motion.span>
  )
}
