import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { EXIT, LAYOUT_T } from '../constants'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'id' | 'children' | 'layoutId'> {
  id: string
  children?: ReactNode
  /** The symbol text, e.g. a letter, number, or glyph. */
  symbol: string
}

export function SymbolChip({ id, symbol, children, exit = EXIT, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      exit={exit}
      layout
      layoutId={id}
      transition={LAYOUT_T}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      data-presentation-symbol={symbol}
    >
      {symbol}
      {children}
    </motion.span>
  )
}
