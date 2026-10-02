import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { StyleProps } from '../types'

export function Box({ id, className, style, children, Icon, as = 'div', ...props }: StyleProps & { children?: React.ReactNode; Icon?: LucideIcon; as?: 'div' | 'article' } & Record<string, unknown>) {
  const Component = as === 'article' ? motion.article : motion.div
  return <Component layout layoutId={id} className={['scene-box', className].filter(Boolean).join(' ')} style={style} data-scene-node="box" data-entity-id={id} {...props}>
    {Icon && <Icon className="scene-box-icon" aria-hidden="true" />}{children}
  </Component>
}
