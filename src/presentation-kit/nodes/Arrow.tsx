import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { StyleProps } from '../types'
import { useEntityMotion } from './entity'

type ArrowProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style'> & StyleProps & { direction?: string }

export function Arrow({ id, className, style, children, direction = 'right', ...props }: ArrowProps) {
  const motionProps = useEntityMotion<HTMLDivElement>(props, style)
  return <motion.div {...props} {...motionProps} layout layoutId={id} className={['scene-arrow', className].filter(Boolean).join(' ')} style={style} data-scene-node="arrow" data-direction={direction} data-entity-id={id} aria-hidden={!children}>{children}</motion.div>
}
