import { motion } from 'motion/react'
import type { StyleProps } from '../types'

export function Label({ id, className, style, children, ...props }: StyleProps & { children?: React.ReactNode } & Record<string, unknown>) {
  return <motion.span layout layoutId={id} className={['scene-label', className].filter(Boolean).join(' ')} style={style} data-scene-node="label" data-entity-id={id} {...props}>{children}</motion.span>
}
