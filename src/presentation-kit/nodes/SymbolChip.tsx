import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { StyleProps } from '../types'
import { useEntityMotion } from './entity'

type SymbolChipProps = Omit<HTMLMotionProps<'span'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style' | 'children'> & StyleProps & { children?: React.ReactNode; symbol?: string }

export function SymbolChip({ id, className, style, children, symbol, ...props }: SymbolChipProps) {
  const motionProps = useEntityMotion<HTMLSpanElement>(props)
  return <motion.span {...props} {...motionProps} layout layoutId={id} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} style={style} data-scene-node="symbol-chip" data-entity-id={id}>{symbol && <span aria-hidden="true">{symbol}</span>}{children}</motion.span>
}
