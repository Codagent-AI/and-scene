import { motion, type HTMLMotionProps } from 'motion/react'

interface FrameProps extends HTMLMotionProps<'div'> { layoutId: string }

export function Frame({ layoutId, className, ...props }: FrameProps) {
  return <motion.div {...props} layout layoutId={layoutId} className={['presentation-frame', className].filter(Boolean).join(' ')} data-presentation-frame data-layout-id={layoutId} />
}
