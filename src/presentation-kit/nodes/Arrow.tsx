import { motion, type HTMLMotionProps } from 'motion/react'
export function Arrow({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div layout layoutId={layoutId} data-presentation-arrow {...props} /> }
