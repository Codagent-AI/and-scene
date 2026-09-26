import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { id: string }
export function Label({ id, className, ...props }: Props) { return <motion.div layout layoutId={id} className={['presentation-label', className].filter(Boolean).join(' ')} data-presentation-node="label" data-entity-id={id} {...props} /> }
