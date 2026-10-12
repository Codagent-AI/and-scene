import { motion, type HTMLMotionProps } from 'motion/react'
export function Label({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div {...props} layout layoutId={layoutId} data-presentation-node="label" /> }
