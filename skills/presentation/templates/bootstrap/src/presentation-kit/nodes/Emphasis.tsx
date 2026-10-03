import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { id: string }
export function Emphasis({ id, className, ...props }: Props) { return <motion.div layout layoutId={id} className={['presentation-emphasis', className].filter(Boolean).join(' ')} data-presentation-node="emphasis" data-entity-id={id} {...props} /> }
