import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { StyleProps } from '../types'
import { useEntityMotion } from './entity'

type BoxProps = Omit<HTMLMotionProps<'div'>, 'id' | 'layout' | 'layoutId' | 'className' | 'style' | 'children'> & StyleProps & { children?: React.ReactNode; Icon?: LucideIcon; as?: 'div' | 'article' }

export function Box({ id, className, style, children, Icon, as = 'div', ...props }: BoxProps) {
  const Component = as === 'article' ? motion.article : motion.div
  const motionProps = useEntityMotion<HTMLDivElement>(props)
  return <Component {...props} {...motionProps} layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} style={style} data-scene-node="box" data-entity-id={id}>
    {Icon && <Icon className="scene-box-icon" aria-hidden="true" />}{children}
  </Component>
}
