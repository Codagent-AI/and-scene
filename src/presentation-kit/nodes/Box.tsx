import { motion, type HTMLMotionProps } from 'motion/react'
export interface BoxProps extends Omit<HTMLMotionProps<'div'>, 'id'> { entityId: string; as?: 'div' | 'article' }
export function Box({ entityId, className, ...props }: BoxProps) {
  return <motion.div layout layoutId={entityId} data-presentation-entity={entityId} className={['presentation-box', className].filter(Boolean).join(' ')} {...props} />
}
