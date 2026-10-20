import { motion, type HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants.ts'

export interface SymbolChipProps extends HTMLMotionProps<'span'> {
  layoutId: string
  symbol: string
}

export function SymbolChip({ layoutId, symbol, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={layoutId}
      transition={LAYOUT_TRANSITION}
      data-presentation-symbol-chip=""
      data-presentation-id={layoutId}
      {...rest}
    >
      {symbol}
    </motion.span>
  )
}
