import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { classNames } from './classNames'

export interface SymbolChipProps {
  /** Stable identity so this entity morphs in place across steps. */
  layoutId: string
  /** Icon glyph shown in the chip. */
  Icon: LucideIcon
  /** Short text shown alongside the glyph. */
  label: string
  className?: string
  style?: CSSProperties
}

/**
 * Generic icon-plus-label chip primitive — the reusable replacement for a
 * talk-specific symbol node. No default pill, border, or color treatment.
 */
export function SymbolChip({ layoutId, Icon, label, className, style }: SymbolChipProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      className={classNames('sk-symbol-chip', className)}
      style={style}
      data-scene-kit="symbol-chip"
    >
      <Icon className="sk-symbol-chip__icon" data-scene-kit="symbol-chip-icon" aria-hidden="true" />
      <span className="sk-symbol-chip__label" data-scene-kit="symbol-chip-label">
        {label}
      </span>
    </motion.div>
  )
}
