import { motion, type HTMLMotionProps } from 'motion/react'
export function SymbolChip({ entityId, ...props }: HTMLMotionProps<'span'> & { entityId: string }) { return <motion.span {...props} layoutId={entityId} data-presentation-node="symbol-chip" data-entity-id={entityId} /> }
