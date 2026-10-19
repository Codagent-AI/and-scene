import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface SymbolChipProps extends Geometry {
  id: string
  Icon?: LucideIcon
  /** Text symbol shown when no icon is given. */
  symbol?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SymbolChip({ id, Icon, symbol, className, style, ...geometry }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : symbol}
    </motion.div>
  )
}
