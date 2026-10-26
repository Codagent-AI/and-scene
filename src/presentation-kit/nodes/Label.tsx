import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface LabelProps extends ComponentPropsWithoutRef<typeof motion.span> {
  layoutId?: string
}

export function Label({ children, ...rest }: LabelProps) {
  return (
    <motion.span layout data-presentation-node="label" {...rest}>
      {children}
    </motion.span>
  )
}
