import { motion, type HTMLMotionProps } from 'motion/react'
export function Arrow({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div {...props} layout layoutId={layoutId} data-presentation-node="arrow" /> }
