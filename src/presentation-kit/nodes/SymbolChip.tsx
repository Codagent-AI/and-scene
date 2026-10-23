import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { EXIT, LAYOUT_TRANSITION } from '../constants'
import type { LucideIcon } from 'lucide-react'
import { geometryStyle, type DataProps, type Geometry } from './shared'

export interface SymbolChipProps extends DataProps {
  id: string
  geometry?: Geometry
  icon?: LucideIcon
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function SymbolChip({ id, geometry, icon: Icon, className, style, children, ...data }: SymbolChipProps) {
  return (
    <motion.div
      {...data}
      layout
      transition={{ layout: LAYOUT_TRANSITION }}
      exit={EXIT}
      layoutId={id}
      className={className}
      style={{ ...geometryStyle(geometry), ...style }}
      data-presentation-node="symbol-chip"
      data-presentation-id={id}
    >
      {Icon ? <Icon aria-hidden="true" data-presentation-glyph="" /> : null}
      {children}
    </motion.div>
  )
}
