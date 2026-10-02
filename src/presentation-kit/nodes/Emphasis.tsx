import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { StyleProps } from '../types'

type EmphasisProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style'> & StyleProps

export function Emphasis({ id, className, style, children, ...props }: EmphasisProps) {
  return <motion.div {...props} layout layoutId={id} className={['scene-emphasis', className].filter(Boolean).join(' ')} style={style} data-scene-node="emphasis" data-entity-id={id}>{children}</motion.div>
}
