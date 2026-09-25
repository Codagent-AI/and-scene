import { motion } from 'motion/react'
import type { EntityPrimitiveProps } from '../types'

export function Arrow({ id, className, children, style, ...props }: EntityPrimitiveProps) {
  return <motion.div layout layoutId={id} className={['scene-arrow', className].filter(Boolean).join(' ')} data-presentation-node="arrow" data-entity-id={id} aria-hidden="true" exit={{ opacity: 0 }} style={style} {...props}>{children ?? '→'}</motion.div>
}
