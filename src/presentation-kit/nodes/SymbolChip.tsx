import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
import { nodeAttrs, rectStyle, type NodeCommonProps, type Rect } from './shared'

export interface SymbolChipProps extends NodeCommonProps, Rect {
  Icon: LucideIcon
  label?: string
}

/** A glyph with an optional short label. Morphs in place when `id` continues. */
export function SymbolChip({ id, Icon, label, className, style, data, ...rect }: SymbolChipProps) {
  return (
    <motion.div
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={{ opacity: 0 }}
      className={className}
      style={{ ...rectStyle(rect), ...style }}
      {...nodeAttrs('chip', id, data)}
    >
      <Icon aria-hidden="true" data-presentation-glyph="" />
      {label ? <span>{label}</span> : null}
    </motion.div>
  )
}
