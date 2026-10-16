import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { LAYOUT_TRANSITION } from '../constants'

export interface SymbolChipProps extends Omit<HTMLMotionProps<'span'>, 'layoutId' | 'id' | 'children'> {
  children?: ReactNode
  id: string
  /** The symbol text or glyph; falls back to children. */
  symbol?: string
}

export function SymbolChip({ id, symbol, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      data-presentation-entity={id}
      data-presentation-node="symbol-chip"
      {...rest}
    >
      {symbol ?? children}
    </motion.span>
  )
}
