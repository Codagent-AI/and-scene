import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
type Props = Omit<HTMLMotionProps<'div'>, 'ref'> & { id: string }
export function SymbolChip({ id, className, ...props }: Props) { return <motion.div layout layoutId={id} className={['presentation-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-node="symbol-chip" data-entity-id={id} {...props} /> }
