import { motion } from 'motion/react'
import type { ComponentPropsWithoutRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface SymbolChipProps extends ComponentPropsWithoutRef<typeof motion.div> {
  /** Stable identity this entity keeps across steps, driving layout morphs. */
  layoutId: string
  label: string
  Icon?: LucideIcon
}

export function SymbolChip({ layoutId, label, Icon, className, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      layoutId={layoutId}
      data-presentation-symbol-chip=""
      className={className}
      {...rest}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-symbol-chip-icon="" /> : null}
      <span data-presentation-symbol-chip-label="">{label}</span>
    </motion.div>
  )
}
