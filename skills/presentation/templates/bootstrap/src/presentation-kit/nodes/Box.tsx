import { motion, type MotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { PrimitiveProps } from '../types'

export interface BoxProps extends PrimitiveProps { layoutId?: string; icon?: LucideIcon; motionProps?: MotionProps }
export function Box({ id, layoutId, className = '', style, icon: Icon, motionProps, children }: BoxProps) {
  return <motion.div layoutId={layoutId ?? id} className={`scene-box ${className}`.trim()} data-presentation-node="box" data-presentation-entity={id} style={style} {...motionProps}>{Icon && <Icon aria-hidden="true" data-presentation-glyph="" />}<span>{children}</span></motion.div>
}
