import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { EASE, LAYOUT_T } from '../constants'
import type { EntityPrimitiveProps } from '../types'

export function Box({ id, Icon, className, children, style, ...props }: EntityPrimitiveProps & { Icon?: LucideIcon }) {
  return <motion.div layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} data-presentation-node="box" data-entity-id={id} exit={{ opacity: 0, scale: 0.96 }} transition={{ layout: { duration: LAYOUT_T, ease: EASE } }} style={style} {...props}>{Icon && <Icon aria-hidden="true" data-presentation-glyph="" />}{children}</motion.div>
}
