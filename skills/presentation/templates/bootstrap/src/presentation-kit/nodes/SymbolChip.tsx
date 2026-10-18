import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { atStyle, entityMotion, type At, type NativeProps, type NodeHooks } from './shared'

export interface SymbolChipProps extends NodeHooks, NativeProps<HTMLSpanElement> {
  at?: At
  /** Short text symbol such as "?" or a check mark. */
  symbol?: ReactNode
  Icon?: LucideIcon
}

export function SymbolChip({ id, at, symbol, Icon, className, style, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      {...rest}
      {...entityMotion}
      layoutId={id}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
      className={className}
      style={atStyle(at, style)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {symbol}
      {children}
    </motion.span>
  )
}
