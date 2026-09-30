import type { ComponentPropsWithoutRef } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

export interface SymbolChipProps extends ComponentPropsWithoutRef<typeof motion.div> {
  layoutId?: string
  icon?: LucideIcon
  label: string
}

export function SymbolChip({ icon: Icon, label, ...rest }: SymbolChipProps) {
  return (
    <motion.div layout data-presentation-node="symbol-chip" {...rest}>
      {Icon ? <Icon aria-hidden="true" data-presentation-node="symbol-chip-icon" /> : null}
      <span data-presentation-node="symbol-chip-label">{label}</span>
    </motion.div>
  )
}
