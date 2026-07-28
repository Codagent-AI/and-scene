import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface FrameProps extends ComponentPropsWithoutRef<typeof motion.div> {
  layoutId?: string
}

export function Frame({ children, ...rest }: FrameProps) {
  return (
    <motion.div layout data-presentation-node="frame" {...rest}>
      {children}
    </motion.div>
  )
}
