import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { geometryStyle, useEntityMotion } from './entity.ts'
import type { Geometry } from './entity.ts'

export interface SymbolChipProps extends Geometry, Omit<HTMLMotionProps<'div'>, 'id' | 'layoutId' | 'children'> {
  children?: ReactNode
  id: string
  symbol: ReactNode
}

export function SymbolChip({ id, x, y, w, h, symbol, style, children, ...rest }: SymbolChipProps) {
  const entity = useEntityMotion(id)
  return (
    <motion.div data-presentation-symbol-chip="" {...entity} style={geometryStyle({ x, y, w, h }, style)} {...rest}>
      <span data-presentation-symbol="">{symbol}</span>
      {children}
    </motion.div>
  )
}
