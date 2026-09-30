import { motion, type HTMLMotionProps } from 'motion/react'

interface EmphasisProps extends HTMLMotionProps<'div'> { layoutId: string }

export function Emphasis({ layoutId, className, ...props }: EmphasisProps) {
  return <motion.div {...props} layout layoutId={layoutId} className={['presentation-emphasis', className].filter(Boolean).join(' ')} data-presentation-emphasis data-layout-id={layoutId} />
}
