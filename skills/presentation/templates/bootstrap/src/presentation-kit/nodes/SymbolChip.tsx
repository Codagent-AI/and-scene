import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { boxStyle, LAYOUT_TRANSITION, type NodeProps } from './shared'

export interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  /** Accessible name for icon-only chips. */
  label?: string
}

/** Small positioned chip holding an icon glyph and/or short text. */
export function SymbolChip({ id, Icon, label, className, children, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-node="chip"
      data-presentation-id={id}
      role={label && !children ? 'img' : undefined}
      aria-label={label}
      className={className}
      style={boxStyle({ id, ...rest })}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.div>
  )
}
