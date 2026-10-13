import { motion, type HTMLMotionProps } from 'motion/react'
export function Frame({ id, className = '', ...props }: HTMLMotionProps<'div'> & { id: string }) { return <motion.div layout layoutId={id} className={className} data-presentation-entity={id} data-presentation-frame {...props} /> }
