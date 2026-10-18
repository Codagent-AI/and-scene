import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants'
import { useEnterMotion } from './useEnterMotion'
import { EXIT, entityAttributes, rectStyle } from './shared'
import type { DataAttributes, NodeProps } from './shared'

export interface SymbolChipProps extends NodeProps, DataAttributes {
  /** Short symbol or glyph text, for example `?` or `✓`. */
  symbol?: ReactNode
  children?: ReactNode
}

export function SymbolChip({
  id,
  className,
  style,
  at,
  emphasis,
  appear,
  symbol,
  children,
  ...data
}: SymbolChipProps) {
  const enter = useEnterMotion(appear)
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      exit={EXIT}
      {...enter}
      className={className}
      style={rectStyle(at, style)}
      {...entityAttributes(id, 'symbol-chip', emphasis)}
      {...data}
    >
      {symbol !== undefined ? <span data-presentation-symbol="">{symbol}</span> : null}
      {children}
    </motion.div>
  )
}
