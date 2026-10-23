import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { placeStyle, type Rect } from './geometry'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  entity: string
  at?: Rect
  /** Symbol text or glyph shown in the chip. */
  symbol?: string
}

export function SymbolChip({ entity, at, symbol, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={entity}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-symbol-chip=""
      data-presentation-entity={entity}
      {...rest}
      style={placeStyle(at, style)}
    >
      {symbol}
      {children}
    </motion.span>
  )
}
