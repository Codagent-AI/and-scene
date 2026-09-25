import { motion } from 'motion/react'
import type { EntityPrimitiveProps } from '../types'

export function Label({ id, className, children, style, ...props }: EntityPrimitiveProps) {
  return <motion.span layout layoutId={id} className={['scene-label', className].filter(Boolean).join(' ')} data-presentation-node="label" data-entity-id={id} exit={{ opacity: 0 }} style={style} {...props}>{children}</motion.span>
}
