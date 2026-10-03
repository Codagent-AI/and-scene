import { motion, type HTMLMotionProps } from 'motion/react'
export function Label({ entityId, className, ...props }: Omit<HTMLMotionProps<'span'>, 'id'> & { entityId: string }) {
  return <motion.span layout layoutId={entityId} data-presentation-entity={entityId} className={['presentation-label', className].filter(Boolean).join(' ')} {...props} />
}
