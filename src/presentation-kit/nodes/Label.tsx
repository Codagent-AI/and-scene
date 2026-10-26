import { motion, type HTMLMotionProps } from 'motion/react'

export interface LabelProps extends HTMLMotionProps<'span'> {
  layoutId: string
}

export function Label({ layoutId, ...props }: LabelProps) {
  return <motion.span layout layoutId={layoutId} data-presentation-label="true" {...props} />
}
