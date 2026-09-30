import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'

export interface EmphasisProps extends ComponentPropsWithoutRef<typeof motion.div> {
  active: boolean
  layoutId?: string
}

export function Emphasis({ active, children, ...rest }: EmphasisProps) {
  return (
    <motion.div
      layout
      data-presentation-node="emphasis"
      data-presentation-active={active}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
