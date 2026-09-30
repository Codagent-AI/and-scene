import { motion, type HTMLMotionProps } from 'motion/react'

export interface EmphasisProps extends HTMLMotionProps<'div'> {
  layoutId: string
}

export function Emphasis({ layoutId, ...props }: EmphasisProps) {
  return <motion.div layout layoutId={layoutId} data-presentation-emphasis="true" {...props} />
}
