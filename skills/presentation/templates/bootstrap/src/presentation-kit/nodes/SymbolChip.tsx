import { motion } from 'motion/react'
import type { EntityPrimitiveProps } from '../types'

export function SymbolChip({ id, className, children, style, ...props }: EntityPrimitiveProps) {
  return <motion.div layout layoutId={id} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} data-presentation-node="symbol-chip" data-entity-id={id} exit={{ opacity: 0 }} style={style} {...props}>{children}</motion.div>
}
