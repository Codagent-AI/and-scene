import { motion, type HTMLMotionProps } from 'motion/react'
export function Emphasis({ layoutId, ...props }: HTMLMotionProps<'div'> & { layoutId: string }) { return <motion.div {...props} layout layoutId={layoutId} data-presentation-node="emphasis" /> }
