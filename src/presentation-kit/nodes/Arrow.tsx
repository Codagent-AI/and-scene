import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface ArrowProps extends ComponentPropsWithoutRef<typeof motion.svg> {
  layoutId?: string
}

export function Arrow({ children, ...rest }: ArrowProps) {
  return (
    <motion.svg layout data-presentation-node="arrow" {...rest}>
      {children}
    </motion.svg>
  )
}
