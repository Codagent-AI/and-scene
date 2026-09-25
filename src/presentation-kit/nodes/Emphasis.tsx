import { motion } from 'motion/react'
import type { EntityPrimitiveProps } from '../types'

export function Emphasis({ id, className, children, style, ...props }: EntityPrimitiveProps) {
  return <motion.div layout layoutId={id} className={['scene-emphasis', className].filter(Boolean).join(' ')} data-presentation-node="emphasis" data-entity-id={id} exit={{ opacity: 0 }} style={style} {...props}>{children}</motion.div>
}
