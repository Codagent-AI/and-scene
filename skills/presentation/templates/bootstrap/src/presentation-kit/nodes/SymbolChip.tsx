import { motion } from 'motion/react'
import type { SceneStyleProps } from '../types'
import { classNames } from '../utils'

interface SymbolChipProps extends SceneStyleProps {
  id: string
  symbol?: string
}

export function SymbolChip({ id, symbol, className, style, children }: SymbolChipProps) {
  return (
    <motion.div
      className={classNames('presentation-symbol-chip', className)}
      data-presentation-node="symbol-chip"
      data-presentation-entity={id}
      exit={{ opacity: 0 }}
      layout
      layoutId={id}
      style={style}
    >
      {symbol ? <span data-presentation-symbol="true">{symbol}</span> : null}
      {children}
    </motion.div>
  )
}
