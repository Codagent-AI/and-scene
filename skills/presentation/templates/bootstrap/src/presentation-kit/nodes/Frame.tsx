import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

export function Frame({ layoutId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'layoutId'> & { layoutId: string }) {
  return <motion.div {...props} layout layoutId={layoutId} className={`presentation-frame${className ? ` ${className}` : ''}`} data-presentation-node="frame" />
}
