import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { LAYOUT_TRANSITION, placementStyle, type NodeBaseProps } from './shared.ts'

export interface SymbolChipProps
  extends NodeBaseProps,
    Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'className' | 'id' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** Text or character symbol. */
  symbol?: ReactNode
  /** Optional glyph, passed as a component. */
  icon?: LucideIcon
  label?: ReactNode
}

export function SymbolChip({ id, x, y, w, h, className, style, symbol, icon: Icon, label, children, ...rest }: SymbolChipProps) {
  return (
    <motion.div
      {...rest}
      layout
      layoutId={id}
      transition={LAYOUT_TRANSITION}
      className={className}
      style={placementStyle({ x, y, w, h }, style)}
      data-presentation-chip=""
      data-presentation-entity={id}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {symbol !== undefined ? <span data-presentation-chip-symbol="">{symbol}</span> : null}
      {label !== undefined ? <span data-presentation-chip-label="">{label}</span> : null}
      {children}
    </motion.div>
  )
}
