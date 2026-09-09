import { motion, type HTMLMotionProps } from 'motion/react'

interface LabelProps extends HTMLMotionProps<'div'> { layoutId: string }

export function Label({ layoutId, className, ...props }: LabelProps) {
  return <motion.div {...props} layout layoutId={layoutId} className={['presentation-label', className].filter(Boolean).join(' ')} data-presentation-label data-layout-id={layoutId} />
}
