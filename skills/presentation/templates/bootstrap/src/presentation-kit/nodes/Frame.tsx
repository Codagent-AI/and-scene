import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { id: string }
export function Frame({ id, className, ...props }: Props) { return <motion.div layout layoutId={id} className={['presentation-frame', className].filter(Boolean).join(' ')} data-presentation-node="frame" data-entity-id={id} {...props} /> }
