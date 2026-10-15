import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_T } from '../constants'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'children'> {
  id: string
  children?: ReactNode
  /** The symbol text, e.g. a letter, number, or glyph. */
  symbol: string
}

export function SymbolChip({ id, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      data-presentation-symbol={symbol}
      {...rest}
    >
      {symbol}
      {children}
    </motion.span>
  )
}
