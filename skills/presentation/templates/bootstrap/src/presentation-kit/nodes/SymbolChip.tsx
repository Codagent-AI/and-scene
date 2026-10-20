import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { rectStyle, type NodeProps } from './common.ts'

export type SymbolChipProps = NodeProps

/** Small symbol or glyph entity. */
export function SymbolChip({ id, rect, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      data-presentation-entity={id}
      data-presentation-node="symbol-chip"
      style={rectStyle(rect, style)}
    >
      {children}
    </motion.span>
  )
}
