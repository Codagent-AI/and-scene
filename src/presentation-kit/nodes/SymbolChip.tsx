import { motion, type HTMLMotionProps } from 'motion/react'
export function SymbolChip({ entityId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'id'> & { entityId: string }) {
  return <motion.div layout layoutId={entityId} data-presentation-entity={entityId} className={['presentation-symbol-chip', className].filter(Boolean).join(' ')} {...props} />
}
