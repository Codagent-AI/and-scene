import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { StyleProps } from '../types'

type FrameProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style'> & StyleProps

export function Frame({ id, className, style, children, ...props }: FrameProps) {
  return <motion.div {...props} layout layoutId={id} className={['scene-frame', className].filter(Boolean).join(' ')} style={style} data-scene-node="frame" data-entity-id={id}>{children}</motion.div>
}
