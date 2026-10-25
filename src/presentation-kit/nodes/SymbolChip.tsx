import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { nodeAttrs, placement, type NodeProps } from './base.ts'

export type SymbolChipProps = NodeProps & { Icon?: LucideIcon; tone?: string }

/** A small symbol chip. `tone` is exposed as data-tone for presentation CSS. */
export function SymbolChip({ id, at, style, allowOverlap, Icon, tone, children, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      {...nodeAttrs('symbol-chip', id, allowOverlap)}
      data-tone={tone}
      {...rest}
      style={placement(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
