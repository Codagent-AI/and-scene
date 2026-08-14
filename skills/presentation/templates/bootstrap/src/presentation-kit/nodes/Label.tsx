import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

export function Label({ layoutId, className, ...props }: Omit<HTMLMotionProps<'span'>, 'layoutId'> & { layoutId: string }) {
  return <motion.span {...props} layout layoutId={layoutId} className={`presentation-label${className ? ` ${className}` : ''}`} data-presentation-node="label" />
}
