import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, EXIT_T, LAYOUT_T } from '../constants'
import { dataHooks, geometryStyle, type DataHooks, type Geometry, enterMotion } from './geometry'

export interface SymbolChipProps extends Geometry, DataHooks {
  id: string
  /** Fade in as a newcomer (after persisting entities settle); toggling never remounts. */
  enter?: boolean
  Icon?: LucideIcon
  /** Text symbol shown when no icon is given. */
  symbol?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SymbolChip({ id, enter, Icon, symbol, className, style, ...geometry }: SymbolChipProps) {
  return (
    <motion.div
      {...dataHooks(geometry)}
      {...enterMotion(enter)}
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      exit={{ opacity: 0, transition: { duration: EXIT_T } }}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon ? <Icon data-presentation-icon="" aria-hidden="true" /> : symbol}
    </motion.div>
  )
}
