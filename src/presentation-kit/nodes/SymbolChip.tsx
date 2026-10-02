import { motion } from 'motion/react'
import type { StyleProps } from '../types'

export function SymbolChip({ id, className, style, children, symbol, ...props }: StyleProps & { children?: React.ReactNode; symbol?: string } & Record<string, unknown>) {
  return <motion.span layout layoutId={id} className={['scene-symbol-chip', className].filter(Boolean).join(' ')} style={style} data-scene-node="symbol-chip" data-entity-id={id} {...props}>{symbol && <span aria-hidden="true">{symbol}</span>}{children}</motion.span>
}
