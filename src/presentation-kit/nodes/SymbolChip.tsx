import { motion, type HTMLMotionProps } from 'motion/react'

export function SymbolChip({ entityId, className, ...props }: HTMLMotionProps<'span'> & { entityId: string }) {
  return <motion.span layoutId={entityId} data-scene-node="symbol-chip" data-entity-id={entityId} className={className} {...props} />
}
