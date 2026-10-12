import { motion, type HTMLMotionProps } from 'motion/react'
export function Frame({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div layout layoutId={layoutId} data-presentation-frame {...props} /> }
