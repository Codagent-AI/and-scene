import { motion } from 'motion/react'
import type { NodeProps } from '../types'
export function SymbolChip({ id, className, children, ...props }: NodeProps) {
  return <motion.span layout layoutId={id} className={className} data-presentation-symbol-chip="" data-entity-id={id} {...props}>{children}</motion.span>
}
