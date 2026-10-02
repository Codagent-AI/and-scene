import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { StyleProps } from '../types'

type LabelProps = Omit<HTMLMotionProps<'span'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style'> & StyleProps

export function Label({ id, className, style, children, ...props }: LabelProps) {
  return <motion.span {...props} layout layoutId={id} className={['scene-label', className].filter(Boolean).join(' ')} style={style} data-scene-node="label" data-entity-id={id}>{children}</motion.span>
}
