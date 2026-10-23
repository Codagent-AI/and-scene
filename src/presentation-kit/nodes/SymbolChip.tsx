import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { EASE, LAYOUT_T } from '../constants.ts'
import { dataProps, entityAttrs, type NodeProps } from './props.ts'

interface SymbolChipProps extends NodeProps {
  Icon?: LucideIcon
  children?: ReactNode
}

/** Small symbol or text chip. */
export function SymbolChip({ id, className, style, Icon, children, ...rest }: SymbolChipProps) {
  return (
    <motion.span
      layout
      layoutId={id}
      transition={{ layout: { duration: LAYOUT_T, ease: EASE } }}
      className={className}
      style={{ position: 'absolute', ...style }}
      {...entityAttrs('symbol-chip', id)}
      {...dataProps(rest)}
    >
      {Icon ? <Icon data-presentation-glyph="" aria-hidden="true" /> : null}
      {children}
    </motion.span>
  )
}
