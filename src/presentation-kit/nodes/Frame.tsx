import { motion, type HTMLMotionProps } from 'motion/react'

export interface FrameProps extends HTMLMotionProps<'div'> {
  layoutId: string
}

export function Frame({ layoutId, ...props }: FrameProps) {
  return <motion.div layout layoutId={layoutId} data-presentation-frame="true" {...props} />
}
