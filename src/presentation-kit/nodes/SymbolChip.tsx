import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { place } from '../layout'
import { dataProps, entityProps, type NodeBase } from './shared'

export interface SymbolChipProps extends NodeBase {
  icon?: LucideIcon
}

/** Small labelled chip, such as a question or status marker. */
export function SymbolChip({ id, x, y, width, height, icon: Icon, className, style, children, allowOverlap, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      {...dataProps(rest)}
      {...entityProps(id, allowOverlap)}
      data-presentation-node="symbol-chip"
      className={className}
      style={{ ...place(x, y, width, height), ...style }}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph="" /> : null}
      {children}
    </motion.div>
  )
}
