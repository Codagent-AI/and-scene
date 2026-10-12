import { motion, type HTMLMotionProps } from 'motion/react'
export function Emphasis({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div layout layoutId={layoutId} data-presentation-emphasis {...props} /> }
