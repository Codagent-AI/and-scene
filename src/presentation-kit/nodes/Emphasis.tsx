import { motion, type HTMLMotionProps } from 'motion/react'
export function Emphasis({ id, className = '', ...props }: HTMLMotionProps<'span'> & { id: string }) { return <motion.span layout layoutId={id} className={className} data-presentation-entity={id} data-presentation-emphasis {...props} /> }
