import { motion, type HTMLMotionProps } from 'motion/react'
export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id'> { entityId: string; as?: 'div' | 'article' }
export function Box({ entityId, as = 'div', className, ...props }: BoxProps) {
  const Component = as === 'article' ? motion.article : motion.div
  return <Component layout layoutId={entityId} data-presentation-entity={entityId} className={['presentation-box', className].filter(Boolean).join(' ')} {...props} />
}
