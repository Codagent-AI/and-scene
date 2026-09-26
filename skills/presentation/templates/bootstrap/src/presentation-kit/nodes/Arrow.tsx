import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { id: string; from?: string; to?: string }
export function Arrow({ id, from, to, className, ...props }: Props) { return <motion.div layout layoutId={id} className={['presentation-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-entity-id={id} data-from={from} data-to={to} {...props} /> }
