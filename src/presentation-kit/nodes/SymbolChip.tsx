import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_T, EASE } from '../constants'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'layoutId' | 'id'> {
  id: string
  /** The symbol text, e.g. a glyph or short token. */
  symbol: string
}

export function SymbolChip({ id, symbol, transition, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={transition ?? { duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      {...rest}
    >
      {symbol}
    </motion.span>
  )
}
