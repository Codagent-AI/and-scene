import { motion, type HTMLMotionProps } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'

export interface SymbolChipProps extends HTMLMotionProps<'span'> {
  layoutId: string
  symbol: string
}

export function SymbolChip({ layoutId, symbol, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-symbol-chip=""
      data-presentation-id={layoutId}
      {...rest}
    >
      {symbol}
    </motion.span>
  )
}
