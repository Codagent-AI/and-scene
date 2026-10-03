import { motion } from 'motion/react'
import type { EntityPrimitiveProps } from '../types'

export function Frame({ id, className, children, style, ...props }: EntityPrimitiveProps) {
  return <motion.div layout layoutId={id} className={['scene-frame', className].filter(Boolean).join(' ')} data-presentation-node="frame" data-entity-id={id} exit={{ opacity: 0 }} style={style} {...props}>{children}</motion.div>
}
