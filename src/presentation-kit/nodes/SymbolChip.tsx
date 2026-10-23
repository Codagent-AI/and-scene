import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
import { appearProps, exitProps, nodeHooks, placement } from './shared'
import type { NodeProps } from './types'

export type SymbolChipProps = NodeProps<'span'> & { Icon?: LucideIcon }

export function SymbolChip({
  layoutId,
  at,
  appear,
  variant,
  style,
  Icon,
  children,
  ...rest
}: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      {...nodeHooks('chip', layoutId, variant)}
      {...appearProps(appear)}
      {...exitProps}
      {...rest}
      style={{ ...placement(at), ...style }}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.span>
  )
}
