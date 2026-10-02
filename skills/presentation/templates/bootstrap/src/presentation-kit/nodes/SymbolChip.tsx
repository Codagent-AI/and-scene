import { motion } from 'motion/react'
import type { PrimitiveProps } from '../types'
export function SymbolChip({ id, className = '', style, children }: PrimitiveProps) { return <motion.div layoutId={id} className={`scene-symbol-chip ${className}`.trim()} data-presentation-node="symbol-chip" data-presentation-entity={id} style={style}>{children}</motion.div> }
