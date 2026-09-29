import { motion, type HTMLMotionProps } from 'motion/react'
export function Arrow({ entityId, className, ...props }: Omit<HTMLMotionProps<'div'>, 'id'> & { entityId: string }) {
  return <motion.div layout layoutId={entityId} data-presentation-entity={entityId} aria-hidden="true" className={['presentation-arrow', className].filter(Boolean).join(' ')} {...props} />
}
