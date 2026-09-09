import { motion, type HTMLMotionProps } from 'motion/react'

interface ArrowProps extends HTMLMotionProps<'div'> { layoutId: string }

export function Arrow({ layoutId, className, ...props }: ArrowProps) {
  return <motion.div {...props} layout layoutId={layoutId} className={['presentation-arrow', className].filter(Boolean).join(' ')} data-presentation-arrow data-layout-id={layoutId} />
}
