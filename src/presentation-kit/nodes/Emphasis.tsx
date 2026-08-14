import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

export function Emphasis({ layoutId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'layoutId'> & { layoutId: string }) {
  return <motion.div {...props} layout layoutId={layoutId} className={`presentation-emphasis${className ? ` ${className}` : ''}`} data-presentation-node="emphasis" />
}
