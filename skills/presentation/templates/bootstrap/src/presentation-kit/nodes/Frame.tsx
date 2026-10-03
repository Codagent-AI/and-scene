import { motion, type HTMLMotionProps } from 'motion/react'
export function Frame({ entityId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'id'> & { entityId: string }) {
  return <motion.div layout layoutId={entityId} data-presentation-entity={entityId} className={['presentation-frame', className].filter(Boolean).join(' ')} {...props} />
}
