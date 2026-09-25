import { motion, type HTMLMotionProps } from 'motion/react'
export function SymbolChip({ id, ...props }: HTMLMotionProps<'div'> & { id: string }) {
  return <motion.div layout layoutId={id} data-presentation-node="symbol-chip" data-entity-id={id} {...props} />
}
