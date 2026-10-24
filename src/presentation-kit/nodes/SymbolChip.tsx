import type { LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { EASE, LAYOUT_T } from '../constants'
import { geometryStyle, type Geometry } from './geometry'

export interface SymbolChipProps extends Geometry {
  id: string
  Icon?: LucideIcon
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SymbolChip({ id, Icon, children, className, style, ...geometry }: SymbolChipProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ duration: LAYOUT_T, ease: EASE }}
      data-presentation-node="chip"
      data-presentation-id={id}
      className={className}
      style={geometryStyle(geometry, style)}
    >
      {Icon && <Icon data-presentation-glyph="" aria-hidden="true" />}
      {children}
    </motion.div>
  )
}
