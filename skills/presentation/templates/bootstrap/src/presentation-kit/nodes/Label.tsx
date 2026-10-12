import { motion, type HTMLMotionProps } from 'motion/react'
export function Label({ layoutId, ...props }: HTMLMotionProps<'span'> & { layoutId?: string }) { return <motion.span layout={layoutId ? true : undefined} layoutId={layoutId} data-presentation-label {...props} /> }
