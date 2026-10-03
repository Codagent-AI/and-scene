import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT } from '../constants'
export function SymbolChip({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} exit={EXIT} data-presentation-node="symbol-chip" data-entity-id={id} {...props} />
}
